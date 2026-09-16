"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-api";
import { PageHeader, AdminButton, Badge, EmptyState } from "@/components/admin/ui";

type AlertRow = {
  id: string;
  name: string;
  slug: string;
  size: string;
  sku?: string;
  stock: number;
  threshold: number;
  status: "low_stock" | "out_of_stock";
};

type Movement = {
  id: string;
  productId: string;
  productName: string;
  size: string;
  delta: number;
  stockAfter?: number;
  reason: string;
  orderId?: string;
  actor?: string;
  createdAt?: string;
};

export default function AdminInventoryPage() {
  const [loading, setLoading] = useState(true);
  const [lowCount, setLowCount] = useState(0);
  const [outCount, setOutCount] = useState(0);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [alertRes, moveRes] = await Promise.all([
          adminFetch<{ alerts: AlertRow[]; lowCount: number; outCount: number }>(
            "/api/inventory/alerts"
          ),
          adminFetch<{ movements: Movement[] }>("/api/inventory/movements?limit=40"),
        ]);
        if (cancelled) return;
        setAlerts(alertRes.alerts || []);
        setLowCount(alertRes.lowCount || 0);
        setOutCount(alertRes.outCount || 0);
        setMovements(moveRes.movements || []);
      } catch (e) {
        console.error("[inventory]", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <PageHeader
        title="Stock"
        subtitle="Which sizes are running out or already sold out"
        actions={
          <Link href="/admin/products/bulk-inventory">
            <AdminButton variant="secondary">Download stock spreadsheet</AdminButton>
          </Link>
        }
      />

      {loading ? (
        <p className="text-[13px] text-neutral-500 animate-pulse">Loading…</p>
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-2 gap-4 max-w-lg">
            <div className="bg-white border border-[var(--color-border)] rounded-xl p-5">
              <p className="text-[11px] tracking-[2px] uppercase text-neutral-500 mb-1">
                Low stock
              </p>
              <p className="text-2xl font-medium">{lowCount}</p>
            </div>
            <div className="bg-white border border-[var(--color-border)] rounded-xl p-5">
              <p className="text-[11px] tracking-[2px] uppercase text-neutral-500 mb-1">
                Out of stock
              </p>
              <p className="text-2xl font-medium">{outCount}</p>
            </div>
          </div>

          <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--color-border)]">
              <h2 className="text-[13px] tracking-[2px] uppercase font-medium">Alerts</h2>
            </div>
            {alerts.length === 0 ? (
              <EmptyState
                title="All tracked sizes have enough stock"
                description="Turn on Track stock on a product so checkout cannot oversell."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="bg-neutral-50 text-[11px] uppercase tracking-wider text-neutral-500">
                      <th className="px-5 py-3">Product</th>
                      <th className="px-5 py-3">Size</th>
                      <th className="px-5 py-3">SKU</th>
                      <th className="px-5 py-3">Stock</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {alerts.map((a) => (
                      <tr key={`${a.id}-${a.size}`} className="hover:bg-neutral-50/80">
                        <td className="px-5 py-3">
                          <Link
                            href={`/admin/products/${a.id}/edit`}
                            className="hover:underline font-medium"
                          >
                            {a.name}
                          </Link>
                        </td>
                        <td className="px-5 py-3">{a.size || "—"}</td>
                        <td className="px-5 py-3 font-mono text-[12px]">{a.sku || "—"}</td>
                        <td className="px-5 py-3 font-medium">{a.stock}</td>
                        <td className="px-5 py-3">
                          <Badge tone={a.status === "out_of_stock" ? "danger" : "warning"}>
                            {a.status === "out_of_stock" ? "Out of stock" : "Low stock"}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--color-border)]">
              <h2 className="text-[13px] tracking-[2px] uppercase font-medium">
                Stock history
              </h2>
            </div>
            {movements.length === 0 ? (
              <p className="px-5 py-8 text-[13px] text-neutral-500">
                No movements yet. They appear after checkout, cancel, return, CSV, or admin
                stock edits.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead>
                    <tr className="bg-neutral-50 text-[11px] uppercase tracking-wider text-neutral-500">
                      <th className="px-5 py-3">When</th>
                      <th className="px-5 py-3">Product</th>
                      <th className="px-5 py-3">Size</th>
                      <th className="px-5 py-3">Change</th>
                      <th className="px-5 py-3">After</th>
                      <th className="px-5 py-3">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {movements.map((m) => (
                      <tr key={m.id}>
                        <td className="px-5 py-3 text-neutral-500 whitespace-nowrap">
                          {m.createdAt
                            ? new Date(m.createdAt).toLocaleString("en-IN")
                            : "—"}
                        </td>
                        <td className="px-5 py-3">
                          {m.productName || m.productId}
                          {m.orderId ? (
                            <span className="block text-[11px] text-neutral-400 font-mono">
                              {m.orderId}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-5 py-3">{m.size || "—"}</td>
                        <td
                          className={`px-5 py-3 font-medium ${
                            m.delta < 0 ? "text-red-700" : "text-emerald-700"
                          }`}
                        >
                          {m.delta > 0 ? `+${m.delta}` : m.delta}
                        </td>
                        <td className="px-5 py-3">{m.stockAfter ?? "—"}</td>
                        <td className="px-5 py-3">
                          {m.reason}
                          {m.actor ? (
                            <span className="text-neutral-400"> · {m.actor}</span>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
