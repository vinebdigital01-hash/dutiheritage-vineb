"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { adminFetch } from "@/lib/admin-api";
import type { OrderDTO } from "@/lib/mappers";
import Barcode from "react-barcode";

export default function PackingSlipPage() {
  const { id } = useParams() as { id: string };
  const [order, setOrder] = useState<OrderDTO | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch<{ order: OrderDTO }>(`/api/orders/${id}`)
      .then((res) => setOrder(res.order))
      .catch((err: Error) => setError(err.message));
  }, [id]);

  if (error) return <div className="p-8 text-red-600">{error}</div>;
  if (!order) return <div className="p-8 font-sans">Loading packing slip…</div>;

  const c = order.customer;

  return (
    <div className="bg-white text-black min-h-screen p-6 print:p-0 font-sans">
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page { margin: 0.6cm; }
          .no-print { display: none !important; }
        }
      `,
        }}
      />
      <div className="max-w-2xl mx-auto border p-8 print:border-0">
        <div className="flex justify-between items-start border-b pb-4 mb-6">
          <div>
            <p className="text-[11px] uppercase tracking-[3px] text-neutral-500">
              Packing slip
            </p>
            <h1 className="text-2xl font-serif tracking-[2px] uppercase mt-1">
              Duti Heritage
            </h1>
            <p className="text-sm mt-2 font-mono">{order.orderId}</p>
          </div>
          <div className="text-right">
            <Barcode
              value={order.orderId}
              width={1.2}
              height={48}
              fontSize={12}
              margin={0}
              displayValue
            />
            <button
              type="button"
              onClick={() => window.print()}
              className="no-print mt-3 border border-black px-3 py-1.5 text-xs uppercase tracking-wide hover:bg-black hover:text-white"
            >
              Print
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 text-sm mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
              Ship to
            </p>
            <p className="font-medium">{c.name}</p>
            <p>{c.phone}</p>
            <p className="mt-1">
              {c.address}
              {c.apartment ? `, ${c.apartment}` : ""}
              <br />
              {c.city}, {c.state} {c.pinCode}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider text-neutral-400 mb-1">
              Payment
            </p>
            <p className="uppercase font-medium">{order.paymentMethod}</p>
            <p>₹{order.total.toLocaleString("en-IN")}</p>
            {order.paymentMethod === "cod" && (
              <p className="mt-2 font-bold text-red-700">COLLECT COD ON DELIVERY</p>
            )}
            {order.trackingInfo?.awb && (
              <p className="mt-2 font-mono text-xs">
                AWB: {order.trackingInfo.awb}
                {order.trackingInfo.courier ? ` · ${order.trackingInfo.courier}` : ""}
              </p>
            )}
          </div>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-[10px] uppercase tracking-wider text-neutral-400">
              <th className="pb-2">Item</th>
              <th className="pb-2">Size</th>
              <th className="pb-2 text-center">Qty</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i} className="border-b border-neutral-100">
                <td className="py-3">{item.name}</td>
                <td>{item.size || "—"}</td>
                <td className="text-center font-medium">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {order.notes && (
          <p className="mt-6 text-xs text-neutral-500">
            Staff note: {order.notes}
          </p>
        )}
      </div>
    </div>
  );
}
