import { Order, type OrderDocument } from "@/models/Order";
import { isRazorpayConfigured, getRazorpay, toPaise } from "@/lib/razorpay";
import { appendTimeline } from "@/lib/order-workspace";
import { logAdminAction } from "@/lib/admin-audit";
import { ApiError } from "@/lib/api";
import type { AuthUser } from "@/lib/auth";

export type RefundChannel = "razorpay" | "manual" | "cod_note";

/** Cap refund to what Razorpay still holds on the payment (handles partial advance). */
export async function onlineRefundableAmount(order: {
  total?: number | null;
  refundedAmount?: number | null;
  razorpayPaymentId?: string | null;
}): Promise<number> {
  const remaining = Math.max(0, Number(order.total || 0) - Number(order.refundedAmount || 0));
  if (remaining <= 0) return 0;
  if (!order.razorpayPaymentId || !isRazorpayConfigured()) return remaining;
  try {
    const rzp = getRazorpay();
    if (!rzp) return remaining;
    const payment = await rzp.payments.fetch(order.razorpayPaymentId);
    const paid = Number(payment.amount || 0) / 100;
    const already = Number(payment.amount_refunded || 0) / 100;
    const onlineLeft = Math.max(0, paid - already);
    return Math.min(remaining, onlineLeft);
  } catch {
    return remaining;
  }
}

export async function refundOrder(opts: {
  order: OrderDocument;
  amount: number;
  reason: string;
  actor: AuthUser;
  request: Request;
  /** Staff confirm money was sent outside Razorpay (cash / UPI / bank). */
  manualConfirmed?: boolean;
  /** When true, skip order.save() — caller will save (e.g. approve-cancel). */
  deferSave?: boolean;
}) {
  const { order, reason, actor, request, manualConfirmed, deferSave } = opts;
  const amount = Number(opts.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    throw new ApiError("Refund amount must be greater than 0");
  }
  const already = Number(order.refundedAmount || 0);
  const remaining = Number(order.total) - already;
  if (amount > remaining + 0.01) {
    throw new ApiError(`Cannot refund more than ₹${remaining.toFixed(0)} remaining`);
  }

  const paidOnline = Boolean(order.razorpayPaymentId);
  const collectedMoney =
    paidOnline ||
    order.paymentStatus === "paid" ||
    order.paymentStatus === "partially_paid";
  let channel: RefundChannel;
  let razorpayRefundId: string | undefined;

  if (paidOnline && isRazorpayConfigured() && !manualConfirmed) {
    const rzp = getRazorpay();
    if (!rzp) {
      throw new ApiError(
        "Razorpay keys are not on the server. Confirm you already refunded outside Razorpay, or add keys."
      );
    }
    const refund = await rzp.payments.refund(order.razorpayPaymentId as string, {
      amount: toPaise(amount),
      notes: { orderId: order.orderId, reason },
    });
    razorpayRefundId = refund.id;
    channel = "razorpay";
  } else if (collectedMoney) {
    if (!manualConfirmed) {
      throw new ApiError(
        paidOnline && !isRazorpayConfigured()
          ? "This order has a Razorpay payment id, but Razorpay keys are not on the server. We will not mark it refunded unless you confirm the money was already sent outside Razorpay (cash, UPI, or bank)."
          : "We will not mark this paid order refunded unless Razorpay can pay them, or you confirm you already paid them outside Razorpay."
      );
    }
    channel = "manual";
  } else {
    channel = "cod_note";
  }

  const nextRefunded = already + amount;
  order.refundedAmount = nextRefunded;
  order.paymentStatus =
    nextRefunded >= Number(order.total) - 0.01 ? "refunded" : "partially_paid";
  if (!Array.isArray(order.refunds)) {
    (order as { refunds: unknown[] }).refunds = [];
  }
  (order.refunds as unknown as Array<Record<string, unknown>>).push({
    amount,
    reason,
    actor: actor.email || actor.uid,
    razorpayRefundId,
    channel,
    at: new Date(),
  });
  if (typeof (order as unknown as { markModified?: (k: string) => void }).markModified === "function") {
    (order as unknown as { markModified: (k: string) => void }).markModified("refunds");
  }

  const channelNote =
    channel === "razorpay"
      ? "via Razorpay"
      : channel === "manual"
        ? "manual (outside Razorpay — not a Razorpay transfer)"
        : "COD / unpaid note — this is not a bank transfer";

  appendTimeline(order, {
    actor: actor.email || actor.uid,
    action: "refund",
    message: `₹${amount} ${channelNote}${reason ? ` — ${reason}` : ""}`,
    internal: true,
  });
  if (typeof (order as unknown as { markModified?: (k: string) => void }).markModified === "function") {
    (order as unknown as { markModified: (k: string) => void }).markModified("timeline");
  }
  if (!deferSave && typeof (order as unknown as { save?: () => Promise<unknown> }).save === "function") {
    await (order as unknown as { save: () => Promise<unknown> }).save();
  }

  await logAdminAction({
    request,
    actor,
    action: "refund",
    resource: "order",
    resourceId: order.orderId,
    message: `₹${amount} ${channel} ${reason}`.trim(),
  });

  return {
    order,
    refundedAmount: nextRefunded,
    channel,
    razorpayRefundId: razorpayRefundId || null,
  };
}

export async function refundOrderById(opts: {
  orderId: string;
  amount: number;
  reason: string;
  actor: AuthUser;
  request: Request;
  manualConfirmed?: boolean;
}) {
  const order = await Order.findOne({ orderId: opts.orderId });
  if (!order) throw new ApiError("Order not found", 404);
  return refundOrder({ ...opts, order });
}
