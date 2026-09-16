import { getRazorpay, isRazorpayConfigured, toPaise } from "@/lib/razorpay";
import { appendTimeline } from "@/lib/order-workspace";
import { logAdminAction } from "@/lib/admin-audit";
import { ApiError } from "@/lib/api";
import type { AuthUser } from "@/lib/auth";
import type { OrderDocument } from "@/models/Order";
import type { StaffRole } from "@/models/Staff";

type OrderRecord = OrderDocument & {
  set: (path: string, val: unknown) => void;
  markModified: (path: string) => void;
  save: () => Promise<unknown>;
};

export async function refundOrder(input: {
  order: OrderRecord;
  amount: number;
  reason: string;
  actor: (AuthUser & { role?: StaffRole | null }) | null;
  request: Request;
}) {
  const { order, reason, actor, request } = input;
  const amount = Math.round(Number(input.amount) * 100) / 100;
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ApiError("Refund amount must be greater than 0");
  }

  const already = Number(order.refundedAmount || 0);
  const remaining = Math.round((Number(order.total) - already) * 100) / 100;
  if (amount > remaining + 0.009) {
    throw new ApiError(`Refund exceeds remaining ₹${remaining.toLocaleString("en-IN")}`);
  }

  let razorpayRefundId = "";
  const prepaid =
    order.paymentMethod === "prepaid" || order.paymentMethod === "partial";
  if (prepaid && order.razorpayPaymentId && isRazorpayConfigured()) {
    const rzp = getRazorpay();
    if (!rzp) throw new ApiError("Razorpay is not configured", 503);
    try {
      const refund = await rzp.payments.refund(order.razorpayPaymentId, {
        amount: toPaise(amount),
        notes: { orderId: order.orderId, reason: reason.slice(0, 100) },
      });
      razorpayRefundId = (refund as { id?: string }).id || "";
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Razorpay refund failed";
      throw new ApiError(msg, 502);
    }
  }

  order.refundedAmount = already + amount;
  const entry = {
    amount,
    reason,
    actor: actor?.email || actor?.uid || "admin",
    razorpayRefundId,
    at: new Date(),
  };
  const prev = Array.isArray(order.refunds) ? [...order.refunds] : [];
  order.set("refunds", [...prev, entry]);

  if (order.refundedAmount >= Number(order.total) - 0.009) {
    order.paymentStatus = "refunded";
  }

  const channel = prepaid && razorpayRefundId ? "Razorpay" : "COD / manual";
  appendTimeline(order, {
    actor: actor?.email || actor?.uid || "admin",
    action: "refund",
    message: `Refunded ₹${amount.toLocaleString("en-IN")} via ${channel}${reason ? ` — ${reason}` : ""}`,
    internal: false,
  });
  order.markModified("timeline");
  await order.save();

  await logAdminAction({
    request,
    actor,
    action: "refund",
    resource: "order",
    resourceId: order.orderId,
    message: `₹${amount} ${channel}`,
  });

  return { razorpayRefundId, refundedAmount: order.refundedAmount };
}
