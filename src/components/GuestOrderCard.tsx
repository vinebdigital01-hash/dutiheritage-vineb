"use client";

import Image from "next/image";
import { CldImage } from "next-cloudinary";
import type { GuestOrderView } from "@/lib/guest-order";

function isCloudinary(src: string) {
  if (!src) return false;
  if (src.includes("res.cloudinary.com")) return true;
  if (src.startsWith("/") || src.startsWith("http") || src.startsWith("blob:")) return false;
  return true;
}

function paymentLabel(order: GuestOrderView) {
  if (order.paymentMethod === "cod") return "Cash on Delivery";
  if (order.paymentMethod === "partial") return "Partial COD (advance paid online)";
  return "Paid online";
}

export function GuestOrderCard({
  order,
  phone,
}: {
  order: GuestOrderView;
  /** Checkout phone — used for guest invoice link after lookup. */
  phone?: string;
}) {
  const trackingUrl = order.trackingInfo?.trackingUrl
    ? order.trackingInfo.trackingUrl.startsWith("http")
      ? order.trackingInfo.trackingUrl
      : `https://${order.trackingInfo.trackingUrl}`
    : null;

  const invoiceHref = phone
    ? `/invoice?orderId=${encodeURIComponent(order.orderId)}&phone=${encodeURIComponent(phone.replace(/\D/g, "").slice(-10))}`
    : `/invoice?orderId=${encodeURIComponent(order.orderId)}`;

  return (
    <div className="text-left w-full border border-[var(--color-border)] rounded-lg p-5 space-y-5 bg-white">
      <div className="flex flex-wrap justify-between gap-2">
        <div>
          <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">Order</p>
          <p className="font-mono text-[15px] font-medium">{order.orderId}</p>
        </div>
        <div className="text-right">
          <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)]">Status</p>
          <p className="text-[14px] font-medium">{order.status}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {order.items.map((item, idx) => (
          <div key={`${item.name}-${idx}`} className="flex gap-3 items-center">
            <div className="relative w-14 h-16 bg-gray-50 shrink-0 overflow-hidden border border-[var(--color-border)]">
              {item.image ? (
                isCloudinary(item.image) ? (
                  <CldImage src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
                ) : (
                  <Image src={item.image} alt={item.name} fill className="object-cover" sizes="56px" />
                )
              ) : null}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] truncate">{item.name}</p>
              <p className="text-[12px] text-[var(--color-text-muted)]">
                Qty {item.quantity}
                {item.size ? ` · ${item.size}` : ""}
                {item.color ? ` · ${item.color}` : ""}
              </p>
            </div>
            <p className="text-[13px] font-medium">
              ₹{(item.price * item.quantity).toLocaleString("en-IN")}
            </p>
          </div>
        ))}
      </div>

      <div className="text-[13px] space-y-1 border-t border-[var(--color-border)] pt-3">
        <div className="flex justify-between text-[var(--color-text-muted)]">
          <span>Subtotal</span>
          <span>₹{order.subtotal.toLocaleString("en-IN")}</span>
        </div>
        {order.discount > 0 && (
          <div className="flex justify-between text-green-700">
            <span>Discount</span>
            <span>- ₹{order.discount.toLocaleString("en-IN")}</span>
          </div>
        )}
        <div className="flex justify-between text-[var(--color-text-muted)]">
          <span>Shipping</span>
          <span>{order.shipping === 0 ? "Free" : `₹${order.shipping.toLocaleString("en-IN")}`}</span>
        </div>
        {order.codCharge > 0 && (
          <div className="flex justify-between text-[var(--color-text-muted)]">
            <span>COD charge</span>
            <span>₹{order.codCharge.toLocaleString("en-IN")}</span>
          </div>
        )}
        {order.prepaidDiscount > 0 && (
          <div className="flex justify-between text-green-700">
            <span>Prepaid discount</span>
            <span>- ₹{order.prepaidDiscount.toLocaleString("en-IN")}</span>
          </div>
        )}
        <div className="flex justify-between font-medium pt-1">
          <span>Total</span>
          <span>₹{order.total.toLocaleString("en-IN")}</span>
        </div>
        <p className="text-[12px] text-[var(--color-text-muted)] pt-1">
          {paymentLabel(order)} · {order.paymentStatus}
        </p>
      </div>

      <div>
        <p className="text-[11px] uppercase tracking-widest text-[var(--color-text-muted)] mb-1">Deliver to</p>
        <p className="text-[13px]">{order.customer.name}</p>
        <p className="text-[13px] text-[var(--color-text-muted)]">{order.customer.addressLine}</p>
      </div>

      {order.trackingInfo?.awb ? (
        <p className="text-[13px]">
          Tracking: {order.trackingInfo.courier || "Courier"}{" "}
          <span className="font-mono font-medium">{order.trackingInfo.awb}</span>
          {" · "}
          <a
            href={trackingUrl || `/track?orderId=${encodeURIComponent(order.orderId)}`}
            {...(trackingUrl
              ? { target: "_blank", rel: "noopener noreferrer" }
              : {})}
            className="underline underline-offset-2 font-medium"
          >
            Track
          </a>
        </p>
      ) : (
        <p className="text-[13px] text-[var(--color-text-muted)]">
          Tracking will appear here when we dispatch the order.
        </p>
      )}

      <div className="flex flex-wrap gap-2 pt-1">
        <a
          href={invoiceHref}
          className="px-5 py-2.5 border border-black text-black text-[12px] font-bold uppercase tracking-widest hover:bg-gray-100 rounded-lg transition-colors"
        >
          Download invoice
        </a>
      </div>
    </div>
  );
}
