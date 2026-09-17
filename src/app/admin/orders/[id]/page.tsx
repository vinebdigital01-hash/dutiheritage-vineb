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
  }) => {
    const nextStatus = overrides?.status ?? status;
    const nextReason = (overrides?.reason ?? reason).trim();
    if ((nextStatus === "Cancelled" || nextStatus === "On Hold") && !nextReason && !overrides?.cancelRequestState) {
      show("Add a reason to pause or cancel (the customer can be notified)", "error");
      return;
    }
    if (!overrides?.cancelRequestState && !window.confirm(`Save this order? Status will be "${nextStatus}".`)) return;
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
      show(e instanceof AdminApiError ? e.message : "Update failed", "error");
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

      {(order as any).cancelRequestState === "requested" && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between">
          <div>
            <h3 className="font-bold text-amber-800 text-[14px]">Cancellation Request Pending</h3>
            <p className="text-amber-700 text-[13px] mt-1">
              Customer has requested to cancel this prepaid order. Reason is logged in the timeline.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={async () => {
                const rejectReason = window.prompt("Reason for declining cancellation?");
                if (!rejectReason) return;
                save({ cancelRequestState: "rejected", cancelRejectReason: rejectReason });
              }}
              className="px-4 py-2 bg-white text-amber-900 border border-amber-300 rounded hover:bg-amber-100 text-[12px] font-bold"
            >
              Decline
            </button>
            <button
              onClick={async () => {
                if (!window.confirm("Approve cancellation? This will cancel the order immediately.")) return;
                save({ status: "Cancelled", reason: "Approved customer cancellation request", cancelRequestState: "accepted" });
              }}
              className="px-4 py-2 bg-amber-600 text-white rounded hover:bg-amber-700 text-[12px] font-bold"
            >
              Approve & Cancel
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
              onClick={async () => {
                const reason = window.prompt("Why is this a return or exchange?");
                if (!reason) return;
                const type =
                  window.confirm("OK = return (item coming back). Cancel = exchange.")
                    ? "return"
                    : "exchange";
                try {
                  await adminFetch("/api/returns", {
                    method: "POST",
                    body: JSON.stringify({
                      orderId: order.orderId,
                      reason,
                      type,
                    }),
                  });
                  show("Sent to the Returns list");
                } catch (e) {
                  show(e instanceof AdminApiError ? e.message : "Could not file return", "error");
                }
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
            <AdminButton
              variant="danger"
              className="w-full"
              disabled={saving}
              onClick={async () => {
                const remaining = order.total - (order.refundedAmount || 0);
                const amount = Number(refundAmount || remaining);
                if (!refundReason.trim()) {
                  show("Please type why money is going back", "error");
                  return;
                }
                if (!window.confirm(`Give back ₹${amount} on ${order.orderId}?`)) return;
                setSaving(true);
                try {
                  const data = await adminFetch<{ order: OrderDTO }>(
                    `/api/orders/${order.orderId}/refund`,
                    {
                      method: "POST",
                      body: JSON.stringify({ amount, reason: refundReason.trim() }),
                    }
                  );
                  applyOrder(data.order);
                  setRefundAmount("");
                  setRefundReason("");
                  show(
                    order.paymentMethod === "cod"
                      ? "COD marked as money given back"
                      : "Money back processed"
                  );
                } catch (e) {
                  show(e instanceof AdminApiError ? e.message : "Refund failed", "error");
                } finally {
                  setSaving(false);
                }
              }}
            >
              Give money back
            </AdminButton>
          </div>
        </section>
      </div>
    </div>
  );
}
