"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GuestOrderCard } from "@/components/GuestOrderCard";
import type { GuestOrderView } from "@/lib/guest-order";

export function TrackOrderClient() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<GuestOrderView | null>(null);

  useEffect(() => {
    const q = searchParams.get("orderId");
    if (q) setOrderId(q);
  }, [searchParams]);

  const lookup = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError("");
    setOrder(null);
    setLoading(true);
    try {
      const res = await fetch("/api/orders/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not find that order.");
      setOrder(data.order);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not find that order.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="w-full min-h-[70vh] px-4 py-16 bg-[var(--color-bg)]">
      <div className="max-w-[520px] mx-auto">
        <h1 className="text-3xl font-serif tracking-[2px] uppercase text-center mb-3">Track order</h1>
        <p className="text-[14px] text-[var(--color-text-muted)] text-center mb-8">
          Enter the order number from your confirmation and the phone used at checkout. No login needed.
        </p>

        <form onSubmit={lookup} className="flex flex-col gap-3 mb-8">
          <input
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            placeholder="Order number (e.g. DH-…)"
            aria-label="Order number"
            className="border border-[var(--color-border)] p-3 text-[14px] rounded-lg outline-none focus:border-black"
            required
          />
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
            placeholder="10-digit phone"
            inputMode="numeric"
            aria-label="Phone"
            className="border border-[var(--color-border)] p-3 text-[14px] rounded-lg outline-none focus:border-black"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white py-3.5 text-[13px] tracking-[2px] uppercase hover:bg-black/90 disabled:opacity-60"
          >
            {loading ? "Looking up…" : "Check status"}
          </button>
        </form>

        {error ? <p className="text-[13px] text-red-700 mb-6">{error}</p> : null}
        {order ? <GuestOrderCard order={order} phone={phone} /> : null}
      </div>
    </main>
  );
}
