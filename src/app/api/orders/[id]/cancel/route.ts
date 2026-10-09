import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models";
import { verifyIdToken, AuthError } from "@/lib/auth";
import { handleApiError, jsonOk, jsonError, requireMongo, ApiError } from "@/lib/api";
import { appendTimeline } from "@/lib/order-workspace";
import {
  sendAdminCancelRequestAlert,
  sendOrderCancelled,
} from "@/lib/automations";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  try {
    requireMongo();
    await connectDB();

    const authHeader = request.headers.get("authorization");
    if (!authHeader) throw new AuthError("Authorization required", 401);

    const user = await verifyIdToken(authHeader);
    const { id } = await params;

    let order = await Order.findById(id).catch(() => null);
    if (!order) order = await Order.findOne({ orderId: id });
    if (!order) return jsonError("Order not found", 404);

    if (order.firebaseUid !== user.uid) {
      throw new AuthError("Not allowed to cancel this order", 403);
    }

    const shippedStatuses = ["Delivered", "Shipped", "In Transit", "Cancelled", "Returned"];
    if (shippedStatuses.includes(order.status)) {
      throw new ApiError("Order cannot be cancelled at this stage.");
    }

    if (order.cancelRequestState === "requested") {
      throw new ApiError("A cancellation request is already pending for this order.");
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
      order.markModified("timeline");
      await order.save();

      void sendAdminCancelRequestAlert({
        orderId: order.orderId,
        reason,
        customerName: order.customer?.name,
        customerEmail: order.customer?.email || user.email,
        total: order.total,
        paymentMethod: order.paymentMethod,
      }).catch((e) => console.error("[cancel-request] staff alert", e));

      return jsonOk({
        success: true,
        requested: true,
        message:
          "Cancel request sent. Support will review it — prepaid refunds only happen after approval.",
      });
    }

    // COD: status-only cancel (no bank refund)
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
      {
        reason: "cancel",
        orderId: order.orderId,
        actor: user.email || user.uid,
      }
    );

    void sendOrderCancelled({
      email: order.customer?.email,
      phone: order.customer?.phone,
      name: order.customer?.name,
      orderId: order.orderId,
      total: order.total,
      customerId: order.customerId?.toString(),
      paymentMethod: "cod",
      refundAmount: 0,
      refundChannel: "cod_note",
    }).catch((e) => console.error("[cod-cancel] email", e));

    return jsonOk({
      success: true,
      requested: false,
      message:
        "Order cancelled. This was cash on delivery — no online payment was taken, so there is no bank refund.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
