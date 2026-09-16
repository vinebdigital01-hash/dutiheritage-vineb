"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminFetch } from "@/lib/admin-api";
import { GstTaxInvoice } from "@/components/admin/GstTaxInvoice";
import type { OrderDTO } from "@/lib/mappers";
import type { StoreSettingsDTO } from "@/lib/store-settings";

export default function InvoicePage() {
  const { id } = useParams() as { id: string };
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [seller, setSeller] = useState<StoreSettingsDTO | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      adminFetch<{ order: OrderDTO }>(`/api/orders/${id}`),
      adminFetch<{ settings: StoreSettingsDTO }>("/api/settings/store").catch(() => null),
    ])
      .then(([orderRes, storeRes]) => {
        setOrder(orderRes.order);
        if (storeRes?.settings) setSeller(storeRes.settings);
      })
      .catch((err: Error) => setError(err.message));
  }, [id]);

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!order) return <div className="p-8 font-sans">Loading invoice…</div>;

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
      <GstTaxInvoice order={order} showPrintButton seller={seller || undefined} />
    </div>
  );
}
