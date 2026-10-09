"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import {
  PageHeader,
  AdminButton,
  AdminInput,
  AdminSelect,
  AdminTextarea,
  Badge,
  useToast,
} from "@/components/admin/ui";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/admin-constants";
import type { OrderDTO } from "@/lib/mappers";
import { ActionModal } from "@/components/ActionModal";

export default function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { show, Toast } = useToast();
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<OrderStatus>("Confirmation Pending");
  const [awb, setAwb] = useState("");
  const [courier, setCourier] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [reason, setReason] = useState("");
  const [timelineNote, setTimelineNote] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [refundManual, setRefundManual] = useState(false);
  const [approveManual, setApproveManual] = useState(false);
  const [dialog, setDialog] = useState<
    null | "hold" | "cancel" | "decline" | "file" | "refund" | "approve-cancel"
  >(null);
  const [fileType, setFileType] = useState<"return" | "exchange">("return");

  const applyOrder = (next: OrderDTO) => {
    setOrder(next);
    setStatus(next.status);
    setAwb(next.trackingInfo?.awb || "");
    setCourier(next.trackingInfo?.courier || "");
    setTrackingUrl(next.trackingInfo?.trackingUrl || "");
    setNotes(next.notes || "");
    setReason(next.statusReason || "");
    setTagInput((next.tags || []).join(", "));
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminFetch<{ order: OrderDTO }>(`/api/orders/${id}`);
      applyOrder(data.order);
    } catch (e) {
      show(e instanceof AdminApiError ? e.message : "Not found", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const save = async (overrides?: {
    status?: OrderStatus;
    reason?: string;
    timelineNote?: string;
    cancelRequestState?: "none" | "requested" | "rejected" | "accepted";
    cancelRejectReason?: string;
    fromModal?: boolean;
  }) => {
    const nextStatus = overrides?.status ?? status;
    const nextReason = (overrides?.reason ?? reason).trim();
    if (
      (nextStatus === "Cancelled" || nextStatus === "On Hold") &&
      !overrides?.fromModal &&
      !overrides?.cancelRequestState
    ) {
      setDialog(nextStatus === "On Hold" ? "hold" : "cancel");
      return;
    }
    if ((nextStatus === "Cancelled" || nextStatus === "On Hold") && !nextReason && !overrides?.cancelRequestState) {
      show("A reason is required to pause or cancel", "error");
      return;
    }
    setSaving(true);
    try {
      const data = await adminFetch<{ order: OrderDTO }>(`/api/orders/${id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: nextStatus,
          reason: nextReason,
          notes,
          tags: tagInput
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          trackingInfo: { awb, courier, trackingUrl },
          timelineNote: overrides?.timelineNote ?? (timelineNote.trim() || undefined),
          cancelRequestState: overrides?.cancelRequestState,
          cancelRejectReason: overrides?.cancelRejectReason,
        }),
      });
      applyOrder(data.order);
      setTimelineNote("");
      show("Order updated — customer can be notified on confirm, pause, cancel, or ship");
    } catch (e) {
      const msg = e instanceof AdminApiError ? e.message : "Update failed";
      show(msg, "error");
      if (overrides?.fromModal) throw new Error(msg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="text-[13px] text-neutral-500 animate-pulse">Loading order…</p>
    );
  }

  if (!order) {
    return (
      <div>
        <p className="mb-4">Order not found.</p>
        <Link href="/admin/orders" className="underline text-[13px]">
          Back to orders
        </Link>
      </div>
    );
  }

  const canConfirm =
    order.status === "Confirmation Pending" || order.status === "On Hold";

  return (
    <div>
      {Toast}
      <PageHeader
        title={order.orderId}
        subtitle={`Placed ${order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN") : ""}`}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link href={`/admin/orders/${order.orderId}/pack`} target="_blank">
              <AdminButton variant="secondary">Packing slip</AdminButton>
            </Link>
            <Link href={`/admin/orders/${order.orderId}/invoice`} target="_blank">
              <AdminButton variant="secondary">Invoice</AdminButton>
            </Link>
            <Link href="/admin/orders">
              <AdminButton variant="ghost">All orders</AdminButton>
            </Link>
          </div>
        }
      />

      {order.cancelRequestState === "requested" && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-amber-800 text-[14px]">Cancellation request pending</h3>
            <p className="text-amber-700 text-[13px] mt-1">
              Customer asked to cancel this {order.paymentMethod} order. Approve will cancel and
              refund ₹
              {(order.total - (order.refundedAmount || 0)).toLocaleString("en-IN")} via Razorpay when
              keys exist. Reason is in the timeline.
            </p>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setDialog("decline")}
              className="px-4 py-2 bg-white text-amber-900 border border-amber-300 rounded hover:bg-amber-100 text-[12px] font-bold"
            >
              Decline
            </button>
            <button
              type="button"
              onClick={() => {
                setApproveManual(false);
                setDialog("approve-cancel");
              }}
              className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 text-[12px] font-bold"
            >
              Approve &amp; refund
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-6">
        {canConfirm && (
          <AdminButton
            disabled={saving}
            onClick={() => save({ status: "Confirmed", reason: reason || "Confirmed by staff" })}
          >
            Confirm order
          </AdminButton>
        )}
        {order.status !== "On Hold" &&
          order.status !== "Cancelled" &&
          order.status !== "Delivered" && (
            <AdminButton
              variant="secondary"
              disabled={saving}
              onClick={() => save({ status: "On Hold" })}
            >
              Pause order
            </AdminButton>
          )}
        {order.status !== "Cancelled" && order.status !== "Delivered" && (
          <AdminButton
            variant="danger"
            disabled={saving}
            onClick={() => save({ status: "Cancelled" })}
          >
            Cancel order
          </AdminButton>
        )}
      </div>

      <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-6">
        <div className="space-y-6">
          <section className="bg-white border border-[var(--color-border)] rounded-xl p-5 shadow-sm">
            <h2 className="text-[12px] tracking-[2px] uppercase text-neutral-500 mb-4">
              Items
            </h2>
            <div className="space-y-4">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex gap-3 items-center">
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-neutral-100 border shrink-0">
                    {item.image && (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover"
                        sizes="56px"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium truncate">{item.name}</p>
                    <p className="text-[12px] text-neutral-500">
                      {item.size || "—"}
                      {item.color ? ` · ${item.color}` : ""} · Qty {item.quantity}
                    </p>
                  </div>
                  <p className="text-[14px] font-medium">
                    ₹
                    {((item.salePrice ?? item.price) * item.quantity).toLocaleString(
                      "en-IN"
                    )}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-4 border-t text-[13px] space-y-1">
              <div className="flex justify-between">
                <span className="text-neutral-500">Subtotal</span>
                <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-500">Shipping</span>
                <span>₹{order.shipping.toLocaleString("en-IN")}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount</span>
                  <span>-₹{order.discount.toLocaleString("en-IN")}</span>
                </div>
              )}
              <div className="flex justify-between font-medium text-[15px] pt-2">
                <span>Total</span>
                <span>₹{order.total.toLocaleString("en-IN")}</span>
              </div>
            </div>
          </section>

          <section className="bg-white border border-[var(--color-border)] rounded-xl p-5 shadow-sm">
            <h2 className="text-[12px] tracking-[2px] uppercase text-neutral-500 mb-4">
              Customer
            </h2>
            <div className="text-[14px] space-y-1">
              <p className="font-medium">{order.customer.name}</p>
              <p>{order.customer.phone}</p>
              {order.customer.email && <p>{order.customer.email}</p>}
              <p className="text-neutral-600 pt-2">
                {order.customer.address}
                {order.customer.apartment ? `, ${order.customer.apartment}` : ""}
                <br />
                {order.customer.city}, {order.customer.state} {order.customer.pinCode}
              </p>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Badge tone="info">{order.paymentMethod}</Badge>
              <Badge>{order.paymentStatus}</Badge>
              {order.couponCode && <Badge tone="success">{order.couponCode}</Badge>}
              {(order.tags || []).map((t) => (
                <Badge key={t}>{t}</Badge>
              ))}
            </div>
          </section>

          <section className="bg-white border border-[var(--color-border)] rounded-xl p-5 shadow-sm">
            <h2 className="text-[12px] tracking-[2px] uppercase text-neutral-500 mb-4">
              Timeline
            </h2>
            {!order.timeline?.length ? (
              <p className="text-[13px] text-neutral-400">
                No events yet. Status changes and notes will appear here.
              </p>
            ) : (
              <ol className="space-y-3 border-l-2 border-neutral-200 pl-4">
                {[...order.timeline].reverse().map((ev, i) => (
                  <li key={`${ev.at}-${i}`}>
                    <p className="text-[13px] font-medium">
                      {ev.action}
                      {ev.toStatus ? ` · ${ev.toStatus}` : ""}
                    </p>
                    {ev.message && (
                      <p className="text-[13px] text-neutral-600">{ev.message}</p>
                    )}
                    <p className="text-[11px] text-neutral-400">
                      {ev.actor} · {new Date(ev.at).toLocaleString("en-IN")}
                      {ev.internal ? " · internal" : ""}
                    </p>
                  </li>
                ))}
              </ol>
            )}
            <div className="mt-4 flex gap-2 items-end">
              <div className="flex-1">
                <AdminInput
                  label="Add internal note"
                  value={timelineNote}
                  onChange={(e) => setTimelineNote(e.target.value)}
                  placeholder="Called customer, waiting for pin…"
                />
              </div>
              <AdminButton
                variant="secondary"
                disabled={saving || !timelineNote.trim()}
                onClick={() => save({ timelineNote: timelineNote.trim() })}
              >
                Add
              </AdminButton>
            </div>
          </section>
        </div>

        <section className="bg-white border border-[var(--color-border)] rounded-xl p-5 shadow-sm h-fit space-y-4">
          <h2 className="text-[12px] tracking-[2px] uppercase text-neutral-500">
            Shipping (you type tracking)
          </h2>
          <AdminSelect
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value as OrderStatus)}
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </AdminSelect>
          <AdminTextarea
            label="Reason (required to pause or cancel)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Customer asked to wait / address incomplete…"
          />
          <AdminInput
            label="Courier name"
            value={courier}
            onChange={(e) => setCourier(e.target.value)}
            placeholder="Delhivery / BlueDart / DTDC…"
          />
          <AdminInput
            label="Tracking number"
            value={awb}
            onChange={(e) => setAwb(e.target.value)}
          />
          <AdminInput
            label="Link to track parcel"
            value={trackingUrl}
            onChange={(e) => setTrackingUrl(e.target.value)}
          />
          <AdminInput
            label="Tags (comma separated)"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            placeholder="vip, call-back"
          />
          <AdminTextarea
            label="Internal notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
          <AdminButton onClick={() => save()} disabled={saving} className="w-full">
            {saving ? "Saving…" : "Save status, tracking, and notes"}
          </AdminButton>

          <div className="pt-4 border-t space-y-3">
            <h3 className="text-[12px] tracking-[2px] uppercase text-neutral-500">
              Return or money back
            </h3>
            <p className="text-[12px] text-neutral-500 normal-case tracking-normal">
              Send to Returns list if the item is coming back. Give money back if you only need a refund.
            </p>
            <AdminButton
              variant="secondary"
              className="w-full"
              disabled={saving}
              onClick={() => {
                setFileType("return");
                setDialog("file");
              }}
            >
              Send to Returns list
            </AdminButton>
            <p className="text-[12px] text-neutral-500 normal-case tracking-normal">
              Still available to give back: ₹
              {(
                order.total - (order.refundedAmount || 0)
              ).toLocaleString("en-IN")}
              {order.refundedAmount
                ? ` (already ₹${order.refundedAmount.toLocaleString("en-IN")})`
                : ""}
            </p>
            {order.paymentMethod === "cod" ||
            (order.paymentStatus !== "paid" &&
              order.paymentStatus !== "partially_paid" &&
              !order.razorpayPaymentId) ? (
              <p className="text-[12px] text-neutral-600 normal-case tracking-normal bg-neutral-50 border border-neutral-200 p-3">
                This is COD or unpaid. Saving here is a <strong>status note</strong> only — it does not send money to a bank or UPI.
              </p>
            ) : (
              <p className="text-[12px] text-neutral-600 normal-case tracking-normal bg-neutral-50 border border-neutral-200 p-3">
                Prepaid: we call Razorpay when a payment id and keys exist. Tick the box below only if you already paid them in cash, UPI, or bank (not Razorpay).
              </p>
            )}
            {(order.refunds || []).length > 0 && (
              <ul className="text-[12px] text-neutral-600 space-y-1">
                {(order.refunds || []).map((r, i) => (
                  <li key={i}>
                    ₹{r.amount.toLocaleString("en-IN")}{" "}
                    {r.channel === "razorpay"
                      ? "via Razorpay"
                      : r.channel === "manual"
                        ? "outside Razorpay (manual)"
                        : r.channel === "cod_note"
                          ? "COD note (not a bank transfer)"
                          : ""}
                    {r.reason ? ` — ${r.reason}` : ""}
                  </li>
                ))}
              </ul>
            )}
            <AdminInput
              label="Amount to give back (₹)"
              value={refundAmount}
              onChange={(e) => setRefundAmount(e.target.value)}
              placeholder={String(order.total - (order.refundedAmount || 0))}
            />
            <AdminInput
              label="Why money back"
              value={refundReason}
              onChange={(e) => setRefundReason(e.target.value)}
              placeholder="Customer returned / partial refund"
            />
            {order.paymentMethod !== "cod" && (
              <label className="flex items-start gap-2 text-[13px] text-neutral-700 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={refundManual}
                  onChange={(e) => setRefundManual(e.target.checked)}
                />
                <span>I paid them outside Razorpay (cash / UPI / bank). Do not call Razorpay.</span>
              </label>
            )}
            <AdminButton
              variant="danger"
              className="w-full"
              disabled={saving}
              onClick={() => {
                if (!refundReason.trim()) {
                  show("Please type why money is going back", "error");
                  return;
                }
                setDialog("refund");
              }}
            >
              Give money back
            </AdminButton>
          </div>
        </section>
      </div>

      <ActionModal
        isOpen={dialog === "hold" || dialog === "cancel"}
        onClose={() => setDialog(null)}
        title={dialog === "hold" ? "Pause this order" : "Cancel this order"}
        description="The customer can be notified. This is required."
        reasonLabel={dialog === "hold" ? "Why pause" : "Why cancel"}
        confirmText={dialog === "hold" ? "Pause order" : "Cancel order"}
        confirmStyle={dialog === "cancel" ? "danger" : "primary"}
        onConfirm={async (typed) => {
          await save({
            status: dialog === "hold" ? "On Hold" : "Cancelled",
            reason: typed,
            fromModal: true,
          });
        }}
      />
      <ActionModal
        isOpen={dialog === "decline"}
        onClose={() => setDialog(null)}
        title="Decline cancellation"
        reasonLabel="Why decline"
        confirmText="Decline"
        confirmStyle="danger"
        onConfirm={async (typed) => {
          await save({ cancelRequestState: "rejected", cancelRejectReason: typed });
        }}
      />
      <ActionModal
        isOpen={dialog === "approve-cancel"}
        onClose={() => setDialog(null)}
        title="Approve cancellation & refund"
        description={`You are about to refund ₹${(order.total - (order.refundedAmount || 0)).toLocaleString("en-IN")} to the customer via Razorpay (when this order has an online payment and keys are configured), then cancel the order.`}
        requireReason={false}
        confirmText="Cancel & refund"
        confirmStyle="danger"
        extra={
          <label className="flex items-start gap-2 text-[13px] text-gray-700">
            <input
              type="checkbox"
              className="mt-1"
              checked={approveManual}
              onChange={(e) => setApproveManual(e.target.checked)}
            />
            <span>
              Money already sent outside Razorpay (cash / UPI / bank). Only tick if Razorpay cannot
              refund this payment.
            </span>
          </label>
        }
        onConfirm={async () => {
          setSaving(true);
          try {
            const data = await adminFetch<{
              order: OrderDTO;
              channel?: string | null;
              refundAmount?: number;
            }>(`/api/orders/${order.orderId}/approve-cancel`, {
              method: "POST",
              body: JSON.stringify({ manualConfirmed: approveManual }),
            });
            applyOrder(data.order);
            setApproveManual(false);
            show(
              data.channel === "razorpay"
                ? `Cancelled · Razorpay refund ₹${Number(data.refundAmount || 0).toLocaleString("en-IN")}`
                : data.channel === "manual"
                  ? "Cancelled · refund recorded outside Razorpay"
                  : "Cancelled"
            );
          } catch (e) {
            throw e instanceof Error ? e : new Error("Approve cancel failed");
          } finally {
            setSaving(false);
          }
        }}
      />
      <ActionModal
        isOpen={dialog === "file"}
        onClose={() => setDialog(null)}
        title="Send to Returns list"
        description="Return = item coming back. Exchange = swap. Restock is still allowed for both. We do not rename the order from here."
        reasonLabel="Why"
        confirmText="Send to Returns"
        extra={
          <label className="flex flex-col gap-1.5">
            <span className="text-[12px] font-bold text-gray-700 uppercase tracking-wider">
              Kind
            </span>
            <select
              className="border border-gray-200 rounded-lg p-3 text-[14px]"
              value={fileType}
              onChange={(e) => setFileType(e.target.value as "return" | "exchange")}
            >
              <option value="return">Return (item coming back)</option>
              <option value="exchange">Exchange (swap)</option>
            </select>
          </label>
        }
        onConfirm={async (typed) => {
          await adminFetch("/api/returns", {
            method: "POST",
            body: JSON.stringify({
              orderId: order.orderId,
              reason: typed,
              type: fileType,
            }),
          });
          show("Sent to the Returns list");
        }}
      />
      <ActionModal
        isOpen={dialog === "refund"}
        onClose={() => setDialog(null)}
        title="Give money back"
        description={`Amount ₹${Number(refundAmount || order.total - (order.refundedAmount || 0)).toLocaleString("en-IN")} of ₹${(order.total - (order.refundedAmount || 0)).toLocaleString("en-IN")} still left.`}
        requireReason={false}
        confirmText="Give money back"
        confirmStyle="danger"
        onConfirm={async () => {
          const remaining = order.total - (order.refundedAmount || 0);
          const amount = Number(refundAmount || remaining);
          setSaving(true);
          try {
            const data = await adminFetch<{ order: OrderDTO; channel?: string }>(
              `/api/orders/${order.orderId}/refund`,
              {
                method: "POST",
                body: JSON.stringify({
                  amount,
                  reason: refundReason.trim(),
                  manualConfirmed: refundManual,
                }),
              }
            );
            applyOrder(data.order);
            setRefundAmount("");
            setRefundReason("");
            setRefundManual(false);
            show(
              data.channel === "razorpay"
                ? "Razorpay refund sent"
                : data.channel === "manual"
                  ? "Recorded as paid outside Razorpay (not a Razorpay transfer)"
                  : "COD/unpaid note saved — not a bank transfer"
            );
          } catch (e) {
            throw e instanceof Error ? e : new Error("Refund failed");
          } finally {
            setSaving(false);
          }
        }}
      />
    </div>
  );
}
