"use client";
import { SkeletonPage } from "@/components/ui/Skeleton";
import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { authHeaders } from "@/lib/checkout-client";
import { GuestOrderCard } from "@/components/GuestOrderCard";
import {
  LAST_ORDER_STORAGE_KEY,
  toGuestOrderView,
  type GuestOrderView,
} from "@/lib/guest-order";
import type { OrderDTO } from "@/lib/mappers";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId") || "";
  const { user } = useAppContext();
  const [order, setOrder] = useState<GuestOrderView | null>(null);
  const [phoneHint, setPhoneHint] = useState("");

  useEffect(() => {
    if (!orderId) return;
    let cancelled = false;

    const fromStorage = (): GuestOrderView | null => {
      try {
        const raw = sessionStorage.getItem(LAST_ORDER_STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as { order?: OrderDTO; phone?: string };
        if (parsed.order?.orderId && parsed.order.orderId === orderId) {
          setPhoneHint(parsed.phone || parsed.order.customer?.phone || "");
          return toGuestOrderView(parsed.order);
        }
      } catch {}
      return null;
    };

    const snapshot = fromStorage();
    if (snapshot && !cancelled) setOrder(snapshot);

    const loadLive = async () => {
      if (user) {
        try {
          const headers = await authHeaders();
          const res = await fetch(`/api/orders/${encodeURIComponent(orderId)}`, { headers });
          if (res.ok) {
            const data = await res.json();
            if (data.order && !cancelled) {
              setOrder(toGuestOrderView(data.order as OrderDTO));
              return;
            }
          }
        } catch {}
      }

      const phone = phoneHint || snapshot?.customer.phone;
      if (phone) {
        try {
          const res = await fetch("/api/orders/lookup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId, phone }),
          });
          if (res.ok) {
            const data = await res.json();
            if (data.order && !cancelled) setOrder(data.order);
          }
        } catch {}
      }
    };

    void loadLive();
    return () => {
      cancelled = true;
    };
  }, [orderId, user, phoneHint]);

  const trackHref = `/track${orderId ? `?orderId=${encodeURIComponent(orderId)}` : ""}`;

  return (
    <main className="w-full min-h-[80vh] flex flex-col items-center justify-start px-4 py-16 bg-[var(--color-bg)]">
      <div className="max-w-[600px] w-full">
        <div className="text-center mb-10">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>

          <h1 className="text-3xl font-serif tracking-[2px] uppercase mb-4">Order Confirmed</h1>

          {orderId ? (
            <p className="text-[15px] font-medium mb-4">
              Order ID:{" "}
              <span className="font-mono tracking-wide text-black">{orderId}</span>
            </p>
          ) : null}

          <p className="text-[var(--color-text-muted)] mb-4 leading-relaxed">
            Thank you. We have received your order and will confirm it shortly.
            Save this order number. Prepaid orders are usually packed within 48 hours; COD follows the same packing after confirmation.
          </p>
          {!user ? (
            <p className="text-[13px] text-[var(--color-text-muted)] mb-6">
              You do not need an account. Track anytime with this order number and the phone you used at checkout.
            </p>
          ) : (
            <p className="text-[13px] text-[var(--color-text-muted)] mb-6">
              You can also open this order from your account.
            </p>
          )}
        </div>

        {order ? <GuestOrderCard order={order} /> : null}

        <p className="text-[13px] text-[var(--color-text-muted)] mt-8 mb-6 text-center leading-relaxed">
          What happens next: we confirm the order → pack → add courier tracking here and on this Track page.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href={trackHref}
            className="inline-block border border-black px-10 py-4 text-[13px] tracking-[2px] uppercase hover:bg-black hover:text-white transition-colors text-center"
          >
            Track order
          </Link>
          {user ? (
            <Link
              href="/account/orders"
              className="inline-block border border-black px-10 py-4 text-[13px] tracking-[2px] uppercase hover:bg-black hover:text-white transition-colors text-center"
            >
              View Account
            </Link>
          ) : null}
          <Link
            href="/collections/all"
            className="inline-block bg-black text-white px-10 py-4 text-[13px] tracking-[2px] uppercase hover:bg-black/90 transition-colors text-center"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="w-full min-h-[80vh] flex items-center justify-center">
          <SkeletonPage />
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
