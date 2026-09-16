import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models";
import { verifyIdToken, AuthError } from "@/lib/auth";
import { handleApiError, jsonOk, jsonError, requireMongo, ApiError } from "@/lib/api";
import { appendTimeline } from "@/lib/order-workspace";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    requireMongo();
    await connectDB();

    const authHeader = request.headers.get("authorization");
    if (!authHeader) throw new AuthError("Authorization required", 401);

    const user = await verifyIdToken(authHeader);
    const { id } = await params;
    
    // Find order
    let order = await Order.findById(id).catch(() => null);
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) return jsonError("Order not found", 404);

    // Verify ownership
    if (order.firebaseUid !== user.uid) {
      throw new AuthError("Not allowed to cancel this order", 403);
    }

    const shippedStatuses = ["Delivered", "Shipped", "In Transit", "Cancelled", "Returned"];
    if (shippedStatuses.includes(order.status)) {
      throw new ApiError("Order cannot be cancelled at this stage.");
    }

    const prevStatus = order.status;
    const body = await request.json().catch(() => ({}));
    const reason = String(body.reason || "Cancelled by customer").trim();

    if (order.paymentMethod === "prepaid" || order.paymentMethod === "partial") {
      order.cancelRequestState = "requested";
      appendTimeline(order, {
        actor: user.email || user.uid,
        action: "cancel_requested",
        message: `Cancellation requested. Reason: ${reason}`,
        internal: false,
      });
    } else {
      order.status = "Cancelled";
      order.statusReason = reason;

      appendTimeline(order, {
        actor: user.email || user.uid,
        action: "status",
        fromStatus: prevStatus,
        toStatus: "Cancelled",
        message: reason,
        internal: false,
      });
    }

    await order.save();

    return jsonOk({ success: true, message: "Order cancelled successfully" });
  } catch (error) {
    return handleApiError(error);
  }
}
