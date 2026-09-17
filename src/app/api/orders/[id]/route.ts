import { connectDB } from "@/lib/mongodb";
import { Order, ORDER_STATUSES, type OrderStatus } from "@/models";
import { requireAuth, getStaffRole, verifyIdToken, AuthError } from "@/lib/auth";
import { toOrder } from "@/lib/mappers";
import {
  sendOrderShipped,
  sendOrderDelivered,
  sendOrderCancelled,
  sendOrderConfirmed,
  sendOrderOnHold,
} from "@/lib/automations";
import {
  handleApiError,
  jsonOk,
  jsonError,
  requireMongo,
  ApiError,
  isValidObjectId,
} from "@/lib/api";
import { appendTimeline } from "@/lib/order-workspace";
import { logAdminAction } from "@/lib/admin-audit";
import { OPS_WRITE } from "@/lib/rbac";

type Params = { params: Promise<{ id: string }> };

async function findOrderByParam(id: string) {
  await connectDB();
  if (isValidObjectId(id)) {
    const byMongoId = await Order.findById(id);
    if (byMongoId) return byMongoId;
  }
  return Order.findOne({ orderId: id });
}

/**
 * GET /api/orders/[id] — by Mongo _id or orderId (DH-...)
 * PUT /api/orders/[id] (admin) — status / tracking / notes / timeline
 */
export async function GET(request: Request, { params }: Params) {
  try {
    requireMongo();
    const authHeader = request.headers.get("authorization");
    if (!authHeader) throw new AuthError("Authorization required", 401);

    const authUser = await verifyIdToken(authHeader);
    const { id } = await params;
    const order = await findOrderByParam(id);
    if (!order) return jsonError("Order not found", 404);

    const admin = Boolean(await getStaffRole(authUser.email));
    if (!admin && order.firebaseUid !== authUser.uid) {
      throw new AuthError("Not allowed to view this order", 403);
    }

    return jsonOk({
      order: toOrder(order.toObject(), {
        includeTimeline: true,
        includeInternal: admin,
      }),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    requireMongo();
    const authUser = await requireAuth(request, { admin: true, roles: OPS_WRITE });

    const { id } = await params;
    const order = await findOrderByParam(id);
    if (!order) return jsonError("Order not found", 404);

    const prevStatus = order.status;
    const body = await request.json();
    const actor = authUser.email || authUser.uid;
    const reason = String(body.reason || body.statusReason || "").trim();

    if (Array.isArray(order.timeline) && order.timeline.length === 0 && order.createdAt) {
      appendTimeline(order, {
        actor: "system",
        action: "placed",
        toStatus: "Confirmation Pending",
        message: "Order placed",
        internal: false,
        at: order.createdAt,
      });
    }

    if (body.status !== undefined) {
      if (!(ORDER_STATUSES as readonly string[]).includes(body.status)) {
        throw new ApiError(
          `Invalid status. Allowed: ${ORDER_STATUSES.join(", ")}`
        );
      }
      if (body.status === "Cancelled" && !reason) {
        throw new ApiError("A reason is required to cancel an order");
      }
      if (body.status === "On Hold" && !reason) {
        throw new ApiError("A reason is required to put an order on hold");
      }
      order.status = body.status as OrderStatus;
      if (reason) order.statusReason = reason;

      if (order.status === "Delivered" && order.paymentStatus === "pending") {
        order.paymentStatus = "paid";
      }

      if (order.status !== prevStatus) {
        appendTimeline(order, {
          actor,
          action: "status",
          fromStatus: prevStatus,
          toStatus: order.status,
          message: reason || `Status changed to ${order.status}`,
          internal: false,
        });
      }
    }

    if (body.cancelRequestState !== undefined) {
      order.cancelRequestState = body.cancelRequestState;
      if (body.cancelRejectReason !== undefined) {
        order.cancelRejectReason = body.cancelRejectReason;
      }
      if (body.cancelRequestState === "rejected") {
        appendTimeline(order, {
          actor,
          action: "cancel_rejected",
          message: `Cancellation request declined. Reason: ${body.cancelRejectReason}`,
          internal: false,
        });
      }
    }

    if (body.paymentStatus !== undefined) {
      const allowed = [
        "pending",
        "paid",
        "partially_paid",
        "failed",
        "refunded",
      ];
      if (!allowed.includes(body.paymentStatus)) {
        throw new ApiError(
          `Invalid paymentStatus. Allowed: ${allowed.join(", ")}`
        );
      }
      if (order.paymentStatus !== body.paymentStatus) {
        appendTimeline(order, {
          actor,
          action: "payment",
          message: `Payment ${order.paymentStatus} → ${body.paymentStatus}`,
          internal: true,
        });
      }
      order.paymentStatus = body.paymentStatus;
    }

    if (body.trackingInfo !== undefined) {
      const prevAwb = order.trackingInfo?.awb || "";
      order.trackingInfo = {
        awb: body.trackingInfo?.awb,
        courier: body.trackingInfo?.courier,
        trackingUrl: body.trackingInfo?.trackingUrl,
      };
      const nextAwb = order.trackingInfo?.awb || "";
      if (nextAwb && nextAwb !== prevAwb) {
        appendTimeline(order, {
          actor,
          action: "tracking",
          message: `AWB ${nextAwb}${order.trackingInfo?.courier ? ` via ${order.trackingInfo.courier}` : ""}`,
          internal: false,
        });
      }
    }

    if (body.notes !== undefined) {
      const nextNotes = String(body.notes);
      if (nextNotes !== (order.notes || "") && nextNotes.trim()) {
        appendTimeline(order, {
          actor,
          action: "note",
          message: nextNotes.trim(),
          internal: true,
        });
      }
      order.notes = nextNotes;
    }

    if (Array.isArray(body.tags)) {
      order.tags = body.tags.map((t: unknown) => String(t).trim()).filter(Boolean);
    }

    if (body.timelineNote) {
      appendTimeline(order, {
        actor,
        action: "note",
        message: String(body.timelineNote).trim(),
        internal: true,
      });
    }

    if (body.razorpayOrderId !== undefined) {
      order.razorpayOrderId = body.razorpayOrderId;
    }
    if (body.razorpayPaymentId !== undefined) {
      order.razorpayPaymentId = body.razorpayPaymentId;
    }

    order.markModified("timeline");
    await order.save();

    const notifyBase = {
      email: order.customer?.email,
      phone: order.customer?.phone,
      name: order.customer?.name,
      orderId: order.orderId,
      customerId: order.customerId?.toString(),
    };

    if (order.status === "Confirmed" && prevStatus !== "Confirmed") {
      void sendOrderConfirmed({
        ...notifyBase,
        total: order.total,
      }).catch((e) => console.error("[order_confirmed]", e));
    }

    if (order.status === "On Hold" && prevStatus !== "On Hold") {
      void sendOrderOnHold({
        ...notifyBase,
        reason: reason || order.statusReason || undefined,
      }).catch((e) => console.error("[order_hold]", e));
    }

    if (order.status === "Shipped" && prevStatus !== "Shipped") {
      void sendOrderShipped({
        ...notifyBase,
        trackingUrl: order.trackingInfo?.trackingUrl,
        courier: order.trackingInfo?.courier,
        awb: order.trackingInfo?.awb,
      }).catch((e) => console.error("[order_shipped]", e));
    }

    if (order.status === "Delivered" && prevStatus !== "Delivered") {
      void sendOrderDelivered(notifyBase).catch((e) =>
        console.error("[order_delivered]", e)
      );
    }

    if (order.status === "Cancelled" && prevStatus !== "Cancelled") {
      const { adjustInventory } = await import("@/services/inventory");
      await adjustInventory(
        order.items.map((l) => ({
          productId: l.productId,
          size: l.size || undefined,
          quantity: l.quantity,
        })),
        true,
        { reason: "cancel", orderId: order.orderId, actor }
      );
      void sendOrderCancelled({
        ...notifyBase,
        total: order.total,
      }).catch((e) => console.error("[order_cancelled]", e));
    }

    if (order.status === "Returned" && prevStatus !== "Returned") {
      const { adjustInventory } = await import("@/services/inventory");
      await adjustInventory(
        order.items.map((l) => ({
          productId: l.productId,
          size: l.size || undefined,
          quantity: l.quantity,
        })),
        true,
        { reason: "return", orderId: order.orderId, actor }
      );
    }

    const auditParts: string[] = [];
    if (order.status !== prevStatus) auditParts.push(`${prevStatus} → ${order.status}`);
    if (reason) auditParts.push(reason);
    await logAdminAction({
      request,
      actor: authUser,
      action: order.status !== prevStatus ? "status" : "update",
      resource: "order",
      resourceId: order.orderId,
      message: auditParts.join(" — ") || "Updated order",
    });

    return jsonOk({
      order: toOrder(order.toObject(), {
        includeTimeline: true,
        includeInternal: true,
      }),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
