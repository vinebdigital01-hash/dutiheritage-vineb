"use client";
import { SkeletonOrderList } from '@/components/ui/Skeleton';
import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { CldImage } from "next-cloudinary";
import { authHeaders } from "@/lib/checkout-client";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/admin-constants";
import type { OrderDTO } from "@/lib/mappers";
import { FiPackage, FiChevronLeft } from "react-icons/fi";
import { useAppContext } from "@/context/AppContext";
import { useRouter } from "next/navigation";

function statusTone(status: string) {
  if (status === "Delivered") return "bg-green-100 text-green-800 border-green-200";
  if (status === "Cancelled" || status === "Returned") return "bg-red-100 text-red-800 border-red-200";
  if (status === "Confirmation Pending") return "bg-amber-100 text-amber-800 border-amber-200";
  return "bg-blue-100 text-blue-800 border-blue-200";
}

function OrderTimeline({ status }: { status: OrderStatus | string }) {
  const flow = ORDER_STATUSES.filter((s) => !["Cancelled", "Returned"].includes(s));
  const currentIdx = flow.indexOf(status as OrderStatus);

  if (status === "Cancelled" || status === "Returned") {
    return (
      <p className="mt-4 pt-4 border-t border-[var(--color-border)] text-[12px] text-red-600 font-medium">
        Order {status}
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
            {i > 0 && <span className="text-gray-300">â†’</span>}
            <span className={current ? "text-blue-600 font-bold" : done ? "text-black font-medium" : ""}>
              {done ? "âœ“ " : ""}{step}
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
  
  const { addToCart, setIsCartOpen } = useAppContext();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    (async () => {
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
        if (!cancelled) setOrders(data.orders || []);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load orders");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const filteredOrders = orders.filter(order => {
    if (filter === "All") return true;
    if (filter === "Processing") return ["Confirmation Pending", "Processing", "Manufacturing"].includes(order.status);
    if (filter === "Shipped") return order.status === "Shipped";
    if (filter === "Delivered") return order.status === "Delivered";
    if (filter === "Cancelled") return ["Cancelled", "Returned"].includes(order.status);
    return true;
  });

  const handleBuyAgain = (order: OrderDTO) => {
    order.items.forEach(item => {
      addToCart({
        id: item.productId,
        name: item.name,
        slug: "", // We don't have slug in order items, but addToCart only strictly needs id/name/price/image
        price: item.price,
        salePrice: item.salePrice || item.price,
        image: item.image,
        categoryId: "",
        collectionId: "",
        description: "",
        colors: [],
        sizes: [],
        images: [],
        stock: 100,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any, item.size || "Default");
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="w-full h-full p-4 md:p-8 lg:p-12 bg-white min-h-screen">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/account" className="md:hidden p-2 -ml-2 rounded-full hover:bg-gray-100">
          <FiChevronLeft className="text-xl" />
        </Link>
        <h1 className="text-2xl md:text-3xl font-serif tracking-[2px] uppercase">My Orders</h1>
      </div>

      <div className="flex overflow-x-auto no-scrollbar gap-2 mb-8 pb-2 border-b border-[var(--color-border)]">
        {["All", "Processing", "Shipped", "Delivered", "Cancelled"].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 text-[13px] font-medium tracking-wide uppercase whitespace-nowrap rounded-full transition-colors ${
              filter === f 
                ? "bg-black text-white" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="w-full py-12 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[13px] text-gray-500 uppercase tracking-widest">Loading Orders...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-600 border border-red-200 rounded-lg text-[13px]">
          {error}
        </div>
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
          <Link href="/collections/all" className="px-8 py-3 bg-black text-white text-[12px] font-bold uppercase tracking-widest hover:bg-gray-800 rounded-lg transition-colors">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {filteredOrders.map(order => (
            <div key={order.id} className="border border-[var(--color-border)] rounded-xl bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="p-5 border-b border-[var(--color-border)] bg-gray-50 flex flex-wrap justify-between items-start gap-4">
                <div className="flex gap-8">
                  <div>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Order Placed</p>
                    <p className="text-[13px] font-medium">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "â€”"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Total</p>
                    <p className="text-[13px] font-medium">â‚¹{order.total.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Order #</p>
                    <p className="text-[13px] font-medium">{order.orderId}</p>
                  </div>
                </div>
                <div className={`px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest border ${statusTone(order.status)}`}>
                  {order.status}
                </div>
              </div>

              <div className="p-5 flex flex-col gap-5">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex gap-4">
                    <Link href={`/products/${item.slug || item.productId}`} className="relative w-20 h-24 bg-gray-100 rounded-lg overflow-hidden shrink-0 border border-gray-200 block hover:opacity-80 transition-opacity">
                      {item.image && (
                        item.image.includes("res.cloudinary.com") ? (
                          <CldImage src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
                        ) : (
                          <Image src={item.image} alt={item.name} fill className="object-cover" sizes="80px" />
                        )
                      )}
                    </Link>
                      <div className="flex-1 min-w-0 py-1">
                      <Link href={`/products/${item.slug || item.productId}`} className="text-[14px] font-medium hover:underline line-clamp-1">{item.name}</Link>
                      <p className="text-[12px] text-gray-500 mt-1">
                        Size: {item.size || 'Default'} <span className="mx-2">â€¢</span> Qty: {item.quantity}
                      </p>
                      <p className="text-[13px] font-semibold mt-2">
                        â‚¹{((item.salePrice ?? item.price)).toLocaleString("en-IN")}
                      </p>
                    </div>
                  </div>
                ))}
                
                <OrderTimeline status={order.status} />
              </div>

              <div className="p-5 border-t border-[var(--color-border)] bg-gray-50/50 flex flex-wrap gap-3 justify-end">
                {order.trackingInfo?.awb && (
                  <a
                    href={order.trackingInfo.trackingUrl?.startsWith("http") ? order.trackingInfo.trackingUrl : `https://${order.trackingInfo.trackingUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2.5 border border-black text-black text-[12px] font-bold uppercase tracking-widest hover:bg-gray-100 rounded-lg transition-colors text-center flex-1 sm:flex-none"
                  >
                    Track Order
                  </a>
                )}
                {order.status === "Delivered" && (
                  <button
                    onClick={() => handleBuyAgain(order)}
                    className="px-6 py-2.5 bg-black text-white text-[12px] font-bold uppercase tracking-widest hover:bg-gray-800 rounded-lg transition-colors flex-1 sm:flex-none"
                  >
                    Buy Again
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
