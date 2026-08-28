import { connectDB } from "@/lib/mongodb";
import { Order, ORDER_STATUSES, type OrderStatus } from "@/models";
import { requireAuth, isAdminEmail, verifyIdToken, AuthError } from "@/lib/auth";
import { toOrder } from "@/lib/mappers";
import { sendOrderShipped, sendOrderDelivered, sendOrderCancelled } from "@/lib/automations";
import {
  handleApiError,
  jsonOk,
  jsonError,
  requireMongo,
  ApiError,
  isValidObjectId,
} from "@/lib/api";

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
 *  - Admin: any order
 *  - User: own order only
 *
 * PUT /api/orders/[id] (admin) — status / tracking / paymentStatus / notes
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

    const admin = isAdminEmail(authUser.email);
    if (!admin && order.firebaseUid !== authUser.uid) {
      throw new AuthError("Not allowed to view this order", 403);
    }

    return jsonOk({ order: toOrder(order.toObject()) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });

    const { id } = await params;
    const order = await findOrderByParam(id);
    if (!order) return jsonError("Order not found", 404);

    const prevStatus = order.status;
    const body = await request.json();

    if (body.status !== undefined) {
      if (!(ORDER_STATUSES as readonly string[]).includes(body.status)) {
        throw new ApiError(
          `Invalid status. Allowed: ${ORDER_STATUSES.join(", ")}`
        );
      }
      order.status = body.status as OrderStatus;
      
      // Auto-update COD payment status when delivered
      if (order.status === "Delivered" && order.paymentStatus === "pending") {
        order.paymentStatus = "paid";
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
      order.paymentStatus = body.paymentStatus;
    }

    if (body.trackingInfo !== undefined) {
      order.trackingInfo = {
        awb: body.trackingInfo?.awb,
        courier: body.trackingInfo?.courier,
        trackingUrl: body.trackingInfo?.trackingUrl,
      };
    }

    if (body.notes !== undefined) order.notes = body.notes;
    if (body.razorpayOrderId !== undefined) {
      order.razorpayOrderId = body.razorpayOrderId;
    }
    if (body.razorpayPaymentId !== undefined) {
      order.razorpayPaymentId = body.razorpayPaymentId;
    }

    await order.save();

    const notifyBase = {
      email: order.customer?.email,
      phone: order.customer?.phone,
      name: order.customer?.name,
      orderId: order.orderId,
      customerId: order.customerId?.toString(),
    };

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
      void sendOrderCancelled({
        ...notifyBase,
        total: order.total,
      }).catch((e) => console.error("[order_cancelled]", e));
    }

    return jsonOk({ order: toOrder(order.toObject()) });
  } catch (error) {
    return handleApiError(error);
  }
}
