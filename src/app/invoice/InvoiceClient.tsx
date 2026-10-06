"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { GstTaxInvoice } from "@/components/admin/GstTaxInvoice";
import { authHeaders } from "@/lib/checkout-client";
import type { OrderDTO } from "@/lib/mappers";

type Seller = {
  legalName: string;
  gstin: string;
  address: string;
  state: string;
  stateCode: string;
  supportEmail: string;
  supportPhone: string;
};

export function InvoiceClient() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState("");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [seller, setSeller] = useState<Seller | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [needsPhone, setNeedsPhone] = useState(false);

  useEffect(() => {
    const qOrder = searchParams.get("orderId") || "";
    const qPhone = searchParams.get("phone") || "";
    if (qOrder) setOrderId(qOrder);
    if (qPhone) setPhone(qPhone.replace(/\D/g, "").slice(0, 10));
    if (qOrder) {
      void loadInvoice(qOrder, qPhone);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const loadInvoice = async (id: string, phoneVal: string) => {
    const oid = id.trim();
    if (!oid) {
      setError("Enter your order number.");
      return;
    }
    setLoading(true);
    setError("");
    setOrder(null);
    setNeedsPhone(false);
    try {
      const headers = await authHeaders();
      const res = await fetch("/api/orders/invoice", {
        method: "POST",
        headers,
        body: JSON.stringify({
          orderId: oid,
          phone: phoneVal.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "Could not load invoice.";
        if (
          res.status === 400 &&
          String(msg).toLowerCase().includes("phone")
        ) {
          setNeedsPhone(true);
        }
        throw new Error(msg);
      }
      setOrder(data.order);
      setSeller(data.seller || null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load invoice.");
    } finally {
      setLoading(false);
    }
  };

  if (order) {
    return (
      <div className="bg-white text-black min-h-screen print:min-h-0 p-4 md:p-8 print:p-0">
        <style
          dangerouslySetInnerHTML={{
            __html: `
        @media print {
          @page { margin: 0.5cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `,
          }}
        />
        <div className="max-w-4xl mx-auto mb-4 print:hidden flex flex-wrap gap-3 items-center justify-between">
          <Link href="/account/orders" className="text-[13px] underline underline-offset-2">
            ← Back to orders
          </Link>
          <p className="text-[12px] text-gray-500">
            Same GST invoice staff print in admin.
          </p>
        </div>
        <GstTaxInvoice order={order} showPrintButton seller={seller || undefined} />
      </div>
    );
  }

  return (
    <main className="w-full min-h-[70vh] px-4 py-16 bg-[var(--color-bg)]">
      <div className="max-w-[480px] mx-auto">
        <h1 className="text-3xl font-serif tracking-[2px] uppercase text-center mb-3">
          Tax invoice
        </h1>
        <p className="text-[14px] text-[var(--color-text-muted)] text-center mb-8">
          Logged-in customers can open an invoice from their order. Guests need
          the order number and checkout phone.
        </p>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            void loadInvoice(orderId, phone);
          }}
          className="flex flex-col gap-3"
        >
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
            placeholder="10-digit phone (guests)"
            inputMode="numeric"
            aria-label="Phone"
            className="border border-[var(--color-border)] p-3 text-[14px] rounded-lg outline-none focus:border-black"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-black text-white py-3.5 text-[13px] tracking-[2px] uppercase hover:bg-black/90 disabled:opacity-60"
          >
            {loading ? "Loading…" : "View invoice"}
          </button>
        </form>
        {needsPhone ? (
          <p className="text-[13px] text-amber-800 mt-4">
            Enter the phone number used at checkout to open this invoice.
          </p>
        ) : null}
        {error ? <p className="text-[13px] text-red-700 mt-4">{error}</p> : null}
      </div>
    </main>
  );
}
