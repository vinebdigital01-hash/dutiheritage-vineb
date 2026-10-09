import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models";
import { requireAuth } from "@/lib/auth";
import { OPS_WRITE } from "@/lib/rbac";
import { refundOrder, onlineRefundableAmount } from "@/lib/order-refund";
import { sendOrderCancelled } from "@/lib/automations";
import { appendTimeline } from "@/lib/order-workspace";
import { toOrder } from "@/lib/mappers";
import { logAdminAction } from "@/lib/admin-audit";
import {
  handleApiError,
  jsonOk,
  jsonError,
  requireMongo,
  ApiError,
  isValidObjectId,
} from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

/**
 * POST /api/orders/[id]/approve-cancel
 * Admin approves a customer prepaid/partial cancel request:
 * cancel order → restock → Razorpay refund (H1) → customer email.
 * Body: { manualConfirmed?: boolean }
 */
export async function POST(request: Request, { params }: Params) {
  try {
    requireMongo();
    const authUser = await requireAuth(request, { admin: true, roles: OPS_WRITE });
    const { id } = await params;
    await connectDB();

    const order = isValidObjectId(id)
      ? (await Order.findById(id)) || (await Order.findOne({ orderId: id }))
      : await Order.findOne({ orderId: id });
    if (!order) return jsonError("Order not found", 404);

    if (order.cancelRequestState !== "requested") {
      throw new ApiError("There is no pending cancellation request on this order", 400);
    }
    if (order.status === "Cancelled") {
      throw new ApiError("Order is already cancelled", 400);
    }

    const body = await request.json().catch(() => ({}));
    const manualConfirmed = Boolean(body.manualConfirmed);
    const actor = authUser.email || authUser.uid;
    const prevStatus = order.status;

    const refundCap = await onlineRefundableAmount(order);
    let refundChannel: "razorpay" | "manual" | "cod_note" | null = null;
    let refundAmount = 0;

    // Refund first when money was collected online — fail before status change if blocked
    if (refundCap > 0 && (order.razorpayPaymentId || order.paymentStatus === "paid" || order.paymentStatus === "partially_paid")) {
      const result = await refundOrder({
        order,
        amount: refundCap,
        reason: "Approved customer cancellation request",
        actor: authUser,
        request,
        manualConfirmed,
        deferSave: true,
      });
      refundChannel = result.channel;
      refundAmount = refundCap;
    }

    order.status = "Cancelled";
    order.statusReason = "Approved customer cancellation request";
    order.cancelRequestState = "accepted";
    appendTimeline(order, {
      actor,
      action: "status",
      fromStatus: prevStatus,
      toStatus: "Cancelled",
      message: "Approved customer cancellation request",
      internal: false,
    });
    order.markModified("timeline");
    await order.save();

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
      email: order.customer?.email,
      phone: order.customer?.phone,
      name: order.customer?.name,
      orderId: order.orderId,
      total: order.total,
      customerId: order.customerId?.toString(),
      paymentMethod: order.paymentMethod,
      refundAmount,
      refundChannel,
    }).catch((e) => console.error("[approve-cancel] customer email", e));

    await logAdminAction({
      request,
      actor: authUser,
      action: "approve_cancel",
      resource: "order",
      resourceId: order.orderId,
      message: `Accepted cancel request${refundAmount ? ` · refund ₹${refundAmount} (${refundChannel})` : ""}`,
    });

    return jsonOk({
      order: toOrder(order.toObject(), {
        includeTimeline: true,
        includeInternal: true,
      }),
      refundAmount,
      channel: refundChannel,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
