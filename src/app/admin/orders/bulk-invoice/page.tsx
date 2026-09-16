"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { adminFetch } from "@/lib/admin-api";
import { GstTaxInvoice } from "@/components/admin/GstTaxInvoice";
import type { OrderDTO } from "@/lib/mappers";
import type { StoreSettingsDTO } from "@/lib/store-settings";

export default function BulkInvoicePage() {
  const searchParams = useSearchParams();
  const idsParam = searchParams.get("ids");

  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [seller, setSeller] = useState<StoreSettingsDTO | undefined>();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!idsParam) {
      setError("No order IDs provided");
      setLoading(false);
      return;
    }

    const ids = idsParam.split(",").map((id) => id.trim()).filter(Boolean);
    if (ids.length === 0) {
      setError("No valid order IDs provided");
      setLoading(false);
      return;
    }

    const fetchAll = async () => {
      try {
        const fetched: OrderDTO[] = [];
        for (const id of ids) {
          const res = await adminFetch<{ order: OrderDTO }>(`/api/orders/${id}`);
          fetched.push(res.order);
        }
        setOrders(fetched);
        try {
          const store = await adminFetch<{ settings: StoreSettingsDTO }>("/api/settings/store");
          setSeller(store.settings);
        } catch {
          /* env fallback on invoice */
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load invoices");
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [idsParam]);

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (loading) return <div className="p-8 font-sans">Loading invoices…</div>;
  if (orders.length === 0) return <div className="p-8 font-sans">No invoices found.</div>;

  return (
    <div className="bg-neutral-100 min-h-screen text-black print:bg-white">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page { margin: 0.5cm; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .page-break { page-break-after: always; break-after: page; }
          .page-break:last-child { page-break-after: auto; break-after: auto; }
        }
      `,
        }}
      />

      <div className="fixed top-4 right-4 print:hidden z-50">
        <button
          type="button"
          onClick={() => window.print()}
          className="bg-black text-white px-6 py-3 text-sm font-bold uppercase tracking-widest hover:bg-gray-800 shadow-xl"
        >
          Print all ({orders.length})
        </button>
      </div>

      {orders.map((order) => (
        <div
          key={order.orderId}
          className="page-break bg-white p-4 md:p-8 print:p-0 mx-auto max-w-4xl border-b-[10px] border-neutral-100 print:border-none mb-8 print:mb-0"
        >
          <GstTaxInvoice order={order} seller={seller} />
        </div>
      ))}
    </div>
  );
}
