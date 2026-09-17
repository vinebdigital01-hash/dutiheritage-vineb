"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { CldImage } from "next-cloudinary";
import { authHeaders } from "@/lib/checkout-client";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/admin-constants";
import type { OrderDTO } from "@/lib/mappers";
import { ActionModal } from "@/components/ActionModal";

function statusTone(status: string) {
  if (status === "Delivered") return "bg-green-100 text-green-800";
  if (status === "Cancelled" || status === "Returned")
    return "bg-red-100 text-red-800";
  if (status === "Confirmation Pending") return "bg-amber-100 text-amber-800";
  return "bg-blue-100 text-blue-800";
}

function OrderTimeline({ status }: { status: OrderStatus | string }) {
  const flow = ORDER_STATUSES.filter(
    (s) => !["Cancelled", "Returned", "On Hold"].includes(s)
  );
  const currentIdx = flow.indexOf(status as OrderStatus);

  if (status === "Cancelled" || status === "Returned") {
    return (
      <p className="mt-4 pt-4 border-t border-[var(--color-border)] text-[12px] text-red-600 font-medium">
        Order {status.toLowerCase()}
      </p>
    );
  }
  if (status === "On Hold") {
    return (
      <p className="mt-4 pt-4 border-t border-[var(--color-border)] text-[12px] text-amber-700 font-medium">
        Order on hold — we will update you shortly
      </p>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex gap-2 text-[10px] text-gray-400 overflow-x-auto whitespace-nowrap pb-1">
      {flow.map((step, i) => {
        const done = currentIdx >= 0 && i <= currentIdx;
        const current = i === currentIdx;
        return (
          <span key={step} className="flex items-center gap-2">
            {i > 0 && <span>→</span>}
            <span
              className={
                current
                  ? "text-blue-600 font-bold"
                  : done
                    ? "text-black font-medium"
                    : ""
              }
            >
              {done ? "✓ " : ""}
              {step}
            </span>
          </span>
        );
      })}
    </div>
  );
}

export function AccountOrders({ limit }: { limit?: number }) {
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: "return" | "cancel" | "cancel_request" | null;
    orderId: string | null;
  }>({ isOpen: false, type: null, orderId: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const headers = await authHeaders();
        const res = await fetch(`/api/orders?limit=${limit || 50}`, { headers });
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch {
          throw new Error("Server error: " + (text.substring(0, 50) + "..."));
        }
        if (!res.ok) throw new Error(data.error || "Could not load orders");
        if (!cancelled) setOrders(data.orders || []);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Failed to load orders");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <p className="text-[13px] text-[var(--color-text-muted)] animate-pulse">
        Loading orders…
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-[13px] text-red-600 bg-red-50 border border-red-100 p-3">
        {error}
      </p>
    );
  }

  if (orders.length === 0) {
    return (
      <p className="text-[13px] text-[var(--color-text-muted)]">
        No orders yet. When you place an order, tracking will appear here.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {orders.map((order) => {
        const first = order.items[0];
        return (
          <div
            key={order.id}
            className="border border-[var(--color-border)] p-4 bg-white"
          >
            <div className="flex justify-between items-start mb-3 pb-3 border-b border-[var(--color-border)]">
              <div>
                <p className="text-[13px] font-medium">Order #{order.orderId}</p>
                <p className="text-[12px] text-[var(--color-text-muted)]">
                  Placed on{" "}
                  {order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"}
                </p>
              </div>
              <span
                className={`text-[11px] font-semibold px-2 py-1 rounded-full uppercase tracking-wide ${statusTone(order.status)}`}
              >
                {order.status}
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mb-3 pb-3 border-b border-[var(--color-border)]">
              {(order.status === "Delivered" || order.status === "Shipped" || order.status === "In Transit") && (
                <button
                  onClick={() => setModalConfig({ isOpen: true, type: "return", orderId: order.orderId })}
                  className="px-6 py-2.5 border border-black text-black text-[12px] font-bold uppercase tracking-widest hover:bg-gray-100 rounded-lg transition-colors flex-1 sm:flex-none"
                >
                  Request return
                </button>
              )}
              {order.paymentMethod === "cod" && !["Delivered", "Shipped", "In Transit", "Cancelled", "Returned", "On Hold"].includes(order.status) && (
                <button
                  onClick={() => setModalConfig({ isOpen: true, type: "cancel", orderId: order.orderId })}
                  className="px-6 py-2.5 border border-red-500 text-red-600 text-[12px] font-bold uppercase tracking-widest hover:bg-red-50 rounded-lg transition-colors flex-1 sm:flex-none"
                >
                  Cancel Order
                </button>
              )}
              {order.paymentMethod !== "cod" && !["Delivered", "Shipped", "In Transit", "Cancelled", "Returned", "On Hold"].includes(order.status) && (
                order.cancelRequestState === "requested" ? (
                  <div className="flex-1 sm:flex-none px-4 py-2 bg-amber-50 text-amber-700 text-[12px] font-bold uppercase tracking-widest rounded-lg border border-amber-200 text-center">
                    Cancel Request Pending
                  </div>
                ) : order.cancelRequestState === "rejected" ? (
                  <div className="flex-1 sm:flex-none flex flex-col gap-1 items-end">
                    <div className="px-4 py-2 bg-red-50 text-red-700 text-[12px] font-bold uppercase tracking-widest rounded-lg border border-red-200 text-center">
                      Cancel Rejected
                    </div>
                    <p className="text-[11px] text-red-600 max-w-[200px] text-right leading-tight">
                      {order.cancelRejectReason}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => setModalConfig({ isOpen: true, type: "cancel_request", orderId: order.orderId })}
                    className="px-6 py-2.5 border border-red-500 text-red-600 text-[12px] font-bold uppercase tracking-widest hover:bg-red-50 rounded-lg transition-colors flex-1 sm:flex-none"
                  >
                    Cancel Order
                  </button>
                )
              )}
            </div>

            <div className="flex flex-col gap-3">
              {order.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="relative w-16 h-16 bg-gray-100 rounded overflow-hidden shrink-0">
                    {item.image && (
                      item.image.includes("res.cloudinary.com") ? (
                        <CldImage src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                      ) : (
                        <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                      )
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] truncate">{item.name}</p>
                    <p className="text-[12px] text-[var(--color-text-muted)]">
                      Qty: {item.quantity}
                      {item.size ? ` · ${item.size}` : ""}
                    </p>
                  </div>
                  <p className="text-[13px] font-medium">
                    ₹
                    {(
                      (item.salePrice ?? item.price) * item.quantity
                    ).toLocaleString("en-IN")}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center mt-3 pt-3 border-t border-[var(--color-border)] text-[13px]">
              <span className="text-[var(--color-text-muted)] capitalize">
                {order.paymentMethod === "cod" && order.paymentStatus === "pending"
                  ? "Cash on Delivery (Pending)"
                  : `${order.paymentMethod} · ${order.paymentStatus}`}
              </span>
              <span className="font-medium">
                Total ₹{order.total.toLocaleString("en-IN")}
              </span>
            </div>

            {order.trackingInfo?.awb && (
              <p className="mt-2 text-[12px] text-neutral-600">
                Tracking: {order.trackingInfo.courier || "Courier"}{" "}
                <span className="font-mono">{order.trackingInfo.awb}</span>
                {order.trackingInfo.trackingUrl && (
                  <>
                    {" · "}
                    <a
                      href={
                        order.trackingInfo.trackingUrl.startsWith("http")
                          ? order.trackingInfo.trackingUrl
                          : `https://${order.trackingInfo.trackingUrl}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline"
                    >
                      Track
                    </a>
                  </>
                )}
              </p>
            )}

            <OrderTimeline status={order.status} />
            {!first && null}
          </div>
        );
      })}

      <ActionModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ isOpen: false, type: null, orderId: null })}
        title={
          modalConfig.type === "return" ? "Request Return/Exchange" :
          modalConfig.type === "cancel_request" ? "Cancel Prepaid Order" :
          "Cancel Order"
        }
        description={
          modalConfig.type === "cancel_request"
            ? "Prepaid orders require support approval to cancel. Please submit your reason below."
            : modalConfig.type === "cancel"
            ? "Are you sure you want to cancel this order?"
            : undefined
        }
        reasonLabel="Reason for request"
        confirmText={
          modalConfig.type === "return" ? "Submit Return" :
          modalConfig.type === "cancel_request" ? "Submit Request" :
          "Confirm Cancel"
        }
        confirmStyle={modalConfig.type === "return" ? "primary" : "danger"}
        onConfirm={async (reason) => {
          if (!modalConfig.orderId) return;
          const headers = { Authorization: `Bearer ${localStorage.getItem("token") || ""}` };
          
          if (modalConfig.type === "return") {
            const res = await fetch("/api/returns", {
              method: "POST",
              headers: { ...headers, "Content-Type": "application/json" },
              body: JSON.stringify({
                orderId: modalConfig.orderId,
                reason,
                type: "return",
              }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Could not submit return");
            window.location.reload();
          } else {
            const res = await fetch(`/api/orders/${modalConfig.orderId}/cancel`, {
              method: "POST",
              headers: { ...headers, "Content-Type": "application/json" },
              body: JSON.stringify({ reason }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error || "Could not cancel order");
            window.location.reload();
          }
        }}
      />
    </div>
  );
}

