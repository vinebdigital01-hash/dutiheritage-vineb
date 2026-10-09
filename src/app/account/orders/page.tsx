"use client";
import { SkeletonOrderList } from "@/components/ui/Skeleton";
import React, { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CldImage } from "next-cloudinary";
import { authHeaders } from "@/lib/checkout-client";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/admin-constants";
import type { OrderDTO } from "@/lib/mappers";
import { FiPackage, FiChevronLeft } from "react-icons/fi";
import { useAppContext } from "@/context/AppContext";
import { ActionModal } from "@/components/ActionModal";
import { ReturnRequestModal } from "@/components/ReturnRequestModal";
import { OrderTrackingBlock } from "@/components/OrderTrackingBlock";
import { reorderOrderLines } from "@/lib/reorder";
import { hasTrackingNumber, resolveTrackingUrl } from "@/lib/order-tracking";

function statusTone(status: string) {
  if (status === "Delivered") return "bg-green-100 text-green-800 border-green-200";
  if (status === "Cancelled" || status === "Returned") return "bg-red-100 text-red-800 border-red-200";
  if (status === "Confirmation Pending") return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-blue-100 text-blue-800 border-blue-200";
}

function returnStatusLabel(status: string) {
  if (status === "requested") return "Return requested";
  if (status === "approved") return "Return approved";
  if (status === "rejected") return "Return rejected";
  if (status === "restocked") return "Return restocked";
  return `Return: ${status}`;
}

function OrderTimeline({ status }: { status: OrderStatus | string }) {
  const flow = ORDER_STATUSES.filter((s) => !["Cancelled", "Returned", "On Hold"].includes(s));
  const currentIdx = flow.indexOf(status as OrderStatus);

  if (status === "Cancelled" || status === "Returned") {
    return (
      <p className="mt-4 pt-4 border-t border-[var(--color-border)] text-[12px] text-red-600 font-medium">
        Order {status}
      </p>
    );
  }
  if (status === "On Hold") {
    return (
      <p className="mt-4 pt-4 border-t border-[var(--color-border)] text-[12px] text-amber-700 font-medium">
        Order on hold
      </p>
    );
  }

  return (
    <div className="mt-4 pt-4 border-t border-[var(--color-border)] flex gap-2 text-[11px] text-gray-400 overflow-x-auto whitespace-nowrap pb-1 no-scrollbar">
      {flow.map((step, i) => {
        const done = currentIdx >= 0 && i <= currentIdx;
        const current = i === currentIdx;
        return (
          <span key={step} className="flex items-center gap-2">
            {i > 0 && <span className="text-gray-300">→</span>}
            <span className={current ? "text-blue-600 font-bold" : done ? "text-black font-medium" : ""}>
              {done ? "✓ " : ""}
              {step}
            </span>
          </span>
        );
      })}
    </div>
  );
}

export default function MyOrdersPage() {
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<"All" | "Processing" | "Shipped" | "Delivered" | "Cancelled">("All");
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    type: "cancel" | "cancel_request" | null;
    orderId: string | null;
  }>({ isOpen: false, type: null, orderId: null });
  const [returnOrder, setReturnOrder] = useState<OrderDTO | null>(null);

  const { addToCart } = useAppContext();

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      const headers = await authHeaders();
      const res = await fetch("/api/orders?limit=100", { headers });
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error("Server error: " + (text.substring(0, 50) + "..."));
      }
      if (!res.ok) throw new Error(data.error || "Could not load orders");
      setOrders(data.orders || []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load orders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadOrders();
  }, [loadOrders]);

  const filteredOrders = orders.filter((order) => {
    if (filter === "All") return true;
    if (filter === "Processing")
      return ["Confirmation Pending", "Processing", "Manufacturing"].includes(order.status);
    if (filter === "Shipped") return order.status === "Shipped" || order.status === "In Transit";
    if (filter === "Delivered") return order.status === "Delivered";
    if (filter === "Cancelled") return ["Cancelled", "Returned"].includes(order.status);
    return true;
  });

  const handleReorder = (order: OrderDTO) => {
    reorderOrderLines(order.items, addToCart);
  };

  const openReturnStatuses = ["requested", "approved"];

  return (
    <div className="w-full h-full p-4 md:p-8 lg:p-12 bg-white min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/account" className="md:hidden p-2 -ml-2 rounded-full hover:bg-gray-100">
          <FiChevronLeft className="text-xl" />
        </Link>
        <h1 className="text-2xl md:text-3xl font-serif tracking-[2px] uppercase">My Orders</h1>
      </div>

      <div className="flex overflow-x-auto no-scrollbar gap-2 mb-8 pb-2 border-b border-[var(--color-border)]">
        {["All", "Processing", "Shipped", "Delivered", "Cancelled"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as typeof filter)}
            className={`px-4 py-2 text-[13px] font-medium tracking-wide uppercase whitespace-nowrap rounded-full transition-colors ${
              filter === f ? "bg-black text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-8">
          <SkeletonOrderList />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg text-[13px]">{error}</div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 flex flex-col items-center text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
            <FiPackage className="text-2xl text-gray-400" />
          </div>
          <h3 className="text-lg font-serif mb-2">No orders found</h3>
          <p className="text-[13px] text-gray-500 mb-6 max-w-sm">
            {filter === "All"
              ? "You haven't placed any orders yet. Once you do, they will appear here."
              : `You don't have any orders in the '${filter}' status.`}
          </p>
          <Link
            href="/collections/all"
            className="px-8 py-3 bg-black text-white text-[12px] font-bold uppercase tracking-widest hover:bg-gray-800 rounded-lg transition-colors"
          >
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {filteredOrders.map((order) => {
            const canReturn =
              ["Delivered", "Shipped", "In Transit"].includes(order.status) &&
              !openReturnStatuses.includes(order.returnRequest?.status || "");
            const trackHref = hasTrackingNumber(order.trackingInfo)
              ? resolveTrackingUrl(order.trackingInfo?.trackingUrl, order.orderId)
              : null;
            const trackExternal = Boolean(trackHref?.startsWith("http"));

            return (
              <div
                key={order.id}
                className="border border-[var(--color-border)] rounded-xl bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="p-5 border-b border-[var(--color-border)] bg-gray-50 flex flex-wrap justify-between items-start gap-4">
                  <div className="flex gap-8">
                    <div>
                      <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Order Placed</p>
                      <p className="text-[13px] font-medium">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Total</p>
                      <p className="text-[13px] font-medium">₹{order.total.toLocaleString("en-IN")}</p>
                    </div>
                    <div className="hidden sm:block">
                      <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Order #</p>
                      <p className="text-[13px] font-medium">{order.orderId}</p>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest border ${statusTone(order.status)}`}
                  >
                    {order.status}
                  </div>
                </div>

                <div className="p-5 flex flex-col gap-5">
                  {order.returnRequest ? (
                    <div
                      className={`text-[12px] px-3 py-2 rounded-lg border ${
                        order.returnRequest.status === "rejected"
                          ? "bg-red-50 text-red-800 border-red-100"
                          : order.returnRequest.status === "approved" ||
                              order.returnRequest.status === "restocked"
                            ? "bg-green-50 text-green-800 border-green-100"
                            : "bg-amber-50 text-amber-800 border-amber-100"
                      }`}
                    >
                      {returnStatusLabel(order.returnRequest.status)}
                      {order.returnRequest.status === "rejected" && order.returnRequest.rejectReason
                        ? ` — ${order.returnRequest.rejectReason}`
                        : ""}
                    </div>
                  ) : null}

                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex gap-4">
                      <Link
                        href={`/products/${item.slug || item.productId}`}
                        className="relative w-20 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200 block hover:opacity-80 transition-opacity"
                      >
                        {item.image &&
                          (item.image.includes("res.cloudinary.com") ? (
                            <CldImage
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          ) : (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              className="object-cover"
                              sizes="80px"
                            />
                          ))}
                      </Link>
                      <div className="flex-1 min-w-0 py-1">
                        <Link
                          href={`/products/${item.slug || item.productId}`}
                          className="text-[14px] font-medium hover:underline line-clamp-1"
                        >
                          {item.name}
                        </Link>
                        <p className="text-[12px] text-gray-500 mt-1">
                          Size: {item.size || "Default"}
                          {item.color ? ` · ${item.color}` : ""}
                          <span className="mx-2">•</span> Qty: {item.quantity}
                        </p>
                        <p className="text-[13px] font-semibold mt-2">
                          ₹{(item.salePrice ?? item.price).toLocaleString("en-IN")}
                        </p>
                      </div>
                    </div>
                  ))}

                  <OrderTrackingBlock orderId={order.orderId} tracking={order.trackingInfo} />
                  <OrderTimeline status={order.status} />
                </div>

                <div className="p-5 border-t border-[var(--color-border)] bg-gray-50/50 flex flex-wrap gap-3 justify-end">
                  <Link
                    href={`/invoice?orderId=${encodeURIComponent(order.orderId)}`}
                    className="px-6 py-2.5 border border-black text-black text-[12px] font-bold uppercase tracking-widest hover:bg-gray-100 rounded-lg transition-colors text-center flex-1 sm:flex-none"
                  >
                    Invoice
                  </Link>
                  {trackHref ? (
                    <a
                      href={trackHref}
                      {...(trackExternal
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      className="px-6 py-2.5 border border-black text-black text-[12px] font-bold uppercase tracking-widest hover:bg-gray-100 rounded-lg transition-colors text-center flex-1 sm:flex-none"
                    >
                      Track Order
                    </a>
                  ) : null}
                  {order.status !== "Cancelled" ? (
                    <button
                      type="button"
                      onClick={() => handleReorder(order)}
                      className="px-6 py-2.5 bg-black text-white text-[12px] font-bold uppercase tracking-widest hover:bg-gray-800 rounded-lg transition-colors flex-1 sm:flex-none"
                    >
                      Reorder
                    </button>
                  ) : null}
                  {canReturn ? (
                    <button
                      type="button"
                      onClick={() => setReturnOrder(order)}
                      className="px-6 py-2.5 border border-black text-black text-[12px] font-bold uppercase tracking-widest hover:bg-gray-100 rounded-lg transition-colors flex-1 sm:flex-none"
                    >
                      Request return
                    </button>
                  ) : null}
                  {order.paymentMethod === "cod" &&
                    !["Delivered", "Shipped", "In Transit", "Cancelled", "Returned", "On Hold"].includes(
                      order.status
                    ) && (
                      <button
                        type="button"
                        onClick={() =>
                          setModalConfig({ isOpen: true, type: "cancel", orderId: order.orderId })
                        }
                        className="px-6 py-2.5 border border-red-500 text-red-600 text-[12px] font-bold uppercase tracking-widest hover:bg-red-50 rounded-lg transition-colors flex-1 sm:flex-none"
                      >
                        Cancel Order
                      </button>
                    )}
                  {order.paymentMethod !== "cod" &&
                    !["Delivered", "Shipped", "In Transit", "Cancelled", "Returned", "On Hold"].includes(
                      order.status
                    ) &&
                    (order.cancelRequestState === "requested" ? (
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
                        type="button"
                        onClick={() =>
                          setModalConfig({
                            isOpen: true,
                            type: "cancel_request",
                            orderId: order.orderId,
                          })
                        }
                        className="px-6 py-2.5 border border-red-500 text-red-600 text-[12px] font-bold uppercase tracking-widest hover:bg-red-50 rounded-lg transition-colors flex-1 sm:flex-none"
                      >
                        Cancel Order
                      </button>
                    ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ReturnRequestModal
        isOpen={Boolean(returnOrder)}
        order={returnOrder}
        onClose={() => setReturnOrder(null)}
        onSubmitted={() => {
          void loadOrders();
        }}
      />

      <ActionModal
        isOpen={modalConfig.isOpen}
        onClose={() => setModalConfig({ isOpen: false, type: null, orderId: null })}
        title={
          modalConfig.type === "cancel_request" ? "Cancel Prepaid Order" : "Cancel Order"
        }
        description={
          modalConfig.type === "cancel_request"
            ? "Prepaid orders require support approval to cancel. After approval, any online payment is refunded via Razorpay."
            : "This cancels the order only. Cash on delivery — no online payment was taken, so there is no bank refund."
        }
        reasonLabel="Reason for request"
        confirmText={
          modalConfig.type === "cancel_request" ? "Submit Request" : "Confirm Cancel"
        }
        confirmStyle="danger"
        onConfirm={async (reason) => {
          if (!modalConfig.orderId) return;
          const headers = await authHeaders();
          const res = await fetch(`/api/orders/${modalConfig.orderId}/cancel`, {
            method: "POST",
            headers: { ...headers, "Content-Type": "application/json" },
            body: JSON.stringify({ reason }),
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error || "Could not cancel order");
          await loadOrders();
        }}
      />
    </div>
  );
}
