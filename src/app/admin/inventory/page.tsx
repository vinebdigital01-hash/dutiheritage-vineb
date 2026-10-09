"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch, AdminApiError, downloadAdminFile } from "@/lib/admin-api";
import {
  PageHeader,
  AdminButton,
  AdminInput,
  Badge,
  EmptyState,
  useToast,
} from "@/components/admin/ui";

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

type StockRow = {
  productId: string;
  name: string;
  size: string;
  color: string;
  sku: string;
  stock: number;
  trackInventory: boolean;
};

export default function AdminInventoryPage() {
  const { show, Toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [lowCount, setLowCount] = useState(0);
  const [outCount, setOutCount] = useState(0);
  const [alerts, setAlerts] = useState<AlertRow[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [rows, setRows] = useState<StockRow[]>([]);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [savingAll, setSavingAll] = useState(false);
  const [q, setQ] = useState("");
  const [qInput, setQInput] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvBusy, setCsvBusy] = useState(false);

  const loadLists = useCallback(async () => {
    const [alertRes, moveRes] = await Promise.all([
      adminFetch<{ alerts: AlertRow[]; lowCount: number; outCount: number }>(
        "/api/inventory/alerts"
      ),
      adminFetch<{ movements: Movement[] }>("/api/inventory/movements?limit=40"),
    ]);
    setAlerts(alertRes.alerts || []);
    setLowCount(alertRes.lowCount || 0);
    setOutCount(alertRes.outCount || 0);
    setMovements(moveRes.movements || []);
  }, []);

  const loadStock = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), limit: "30" });
    if (q) params.set("q", q);
    const data = await adminFetch<{
      rows: StockRow[];
      totalPages: number;
    }>(`/api/inventory/stock?${params}`);
    setRows(data.rows || []);
    setTotalPages(data.totalPages || 1);
    setDraft({});
  }, [page, q]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Promise.all([loadLists(), loadStock()]);
      } catch (e) {
        console.error("[inventory]", e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadLists, loadStock]);

  const rowKey = (r: StockRow) => `${r.productId}:${r.color || ""}:${r.size}`;

  const saveQty = async (productId: string, color: string, size: string, stock: number) => {
    const key = `${productId}:${color}:${size}`;
    setBusyKey(key);
    try {
      await adminFetch("/api/inventory/stock", {
        method: "POST",
        body: JSON.stringify({ productId, color, size, stock }),
      });
      show(`Saved ${size} → ${stock}`);
      await Promise.all([loadLists(), loadStock()]);
    } catch (e) {
      show(e instanceof AdminApiError ? e.message : "Could not save quantity", "error");
    } finally {
      setBusyKey(null);
    }
  };

    const saveAllDrafts = async () => {
    const items = Object.entries(draft).map(([key, stock]) => {
      const [productId, size] = key.split(":");
      return { productId, size, stock: Number(stock) };
    }).filter(i => !isNaN(i.stock) && i.stock >= 0);
    
    if (items.length === 0) {
      show("No valid changes to save", "error");
      return;
    }
    setSavingAll(true);
    try {
      const data = await adminFetch<{ updatedCount: number }>("/api/inventory/stock", {
        method: "POST",
        body: JSON.stringify({ items }),
      });
      show(`Updated ${data.updatedCount} sizes`);
      setDraft({});
      await Promise.all([loadLists(), loadStock()]);
    } catch (e) {
      show(e instanceof AdminApiError ? e.message : "Could not save all", "error");
    } finally {
      setSavingAll(false);
    }
  };

  const uploadCsv = async () => {
    if (!csvFile) {
      show("Choose the spreadsheet first", "error");
      return;
    }
    setCsvBusy(true);
    try {
      const { parseSpreadsheetFile } = await import("@/lib/spreadsheet-client");
      const rows = await parseSpreadsheetFile(csvFile);
      const data = await adminFetch<{ updatedCount: number }>("/api/inventory/stock", {
        method: "POST",
        body: JSON.stringify({ items: rows }),
      });
      show(`Updated ${data.updatedCount} sizes`);
      setCsvFile(null);
      await Promise.all([loadLists(), loadStock()]);
    } catch (e) {
      show(e instanceof AdminApiError ? e.message : e instanceof Error ? e.message : "Upload failed", "error");
    } finally {
      setCsvBusy(false);
    }
  };

  return (
    <div>
      {Toast}
      <PageHeader
        title="Stock"
        subtitle="Type a new quantity for a size here. You do not need to open Products."
        actions={
          <AdminButton
            variant="secondary"
            onClick={() =>
              downloadAdminFile("/api/inventory/export", "inventory.csv").catch((e) =>
                show(e instanceof Error ? e.message : "Download failed", "error")
              )
            }
          >
            Download CSV Template
          </AdminButton>
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
            <div className="px-5 py-4 border-b border-[var(--color-border)] space-y-3">
              <h2 className="text-[13px] tracking-[2px] uppercase font-medium">
                Set quantity
              </h2>
              <p className="text-[12px] text-neutral-500 normal-case tracking-normal">
                Search a product, type the new qty, Save. Stock history is kept below. This is not a courier pickup.
              </p>
              <form
                className="flex flex-wrap gap-2 items-end"
                onSubmit={(e) => {
                  e.preventDefault();
                  setPage(1);
                  setQ(qInput.trim());
                }}
              >
                <div className="min-w-[200px] flex-1">
                  <AdminInput
                    label="Find product"
                    value={qInput}
                    onChange={(e) => setQInput(e.target.value)}
                    placeholder="Name"
                  />
                </div>
                <AdminButton type="submit" variant="secondary">
                  Search
                </AdminButton>
              </form>
            </div>
            {rows.length === 0 ? (
              <EmptyState
                title="No sizes to count"
                description="Add sizes when creating a product. New products track stock on."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px] min-w-[640px]">
                  <thead>
                    <tr className="bg-neutral-50 text-[11px] uppercase tracking-wider text-neutral-500">
                      <th className="px-5 py-3">Product</th>
                      <th className="px-5 py-3">Color</th>
                      <th className="px-5 py-3">Size</th>
                      <th className="px-5 py-3">Now</th>
                      <th className="px-5 py-3">New qty</th>
                      <th className="px-5 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {rows.map((r) => {
                      const key = rowKey(r);
                      const value = draft[key] ?? String(r.stock);
                      return (
                        <tr key={key} className="hover:bg-neutral-50/80">
                          <td className="px-5 py-3 font-medium">
                            {r.name}
                            {!r.trackInventory ? (
                              <span className="block text-[11px] font-normal text-neutral-400">
                                Tracking will turn on when you save
                              </span>
                            ) : null}
                          </td>
                          <td className="px-5 py-3">{r.size}</td>
                          <td className="px-5 py-3">{r.stock}</td>
                          <td className="px-5 py-3 w-28">
                            <input
                              type="number"
                              min={0}
                              className="w-full border border-[var(--color-border)] rounded-lg px-2 py-1.5 text-[13px]"
                              value={value}
                              onChange={(e) =>
                                setDraft((d) => ({ ...d, [key]: e.target.value }))
                              }
                            />
                          </td>
                          <td className="px-5 py-3">
                            <AdminButton
                              disabled={busyKey === key}
                              onClick={() => saveQty(r.productId, r.color || "", r.size, Number(value))}
                            >
                              {busyKey === key ? "Saving…" : "Save"}
                            </AdminButton>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            {totalPages > 1 && (
              <div className="px-5 py-3 flex gap-2 border-t border-[var(--color-border)]">
                <AdminButton
                  variant="secondary"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </AdminButton>
                <AdminButton
                  variant="secondary"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </AdminButton>
              </div>
            )}
          </div>

          <div className="bg-white border border-[var(--color-border)] rounded-xl p-5 space-y-3 max-w-lg">
            <h2 className="text-[13px] tracking-[2px] uppercase font-medium">
              Or upload the spreadsheet
            </h2>
            <p className="text-[12px] text-neutral-500">
              Download, change the stock column, upload as Excel (.xlsx) or CSV. Do not change productId or size.
            </p>
            <input
              type="file"
              accept=".csv,.xlsx"
              onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
              className="block text-[13px] text-neutral-600"
            />
            <AdminButton onClick={uploadCsv} disabled={!csvFile || csvBusy}>
              {csvBusy ? "Uploading…" : "Upload CSV File"}
            </AdminButton>
          </div>

          <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--color-border)]">
              <h2 className="text-[13px] tracking-[2px] uppercase font-medium">Alerts</h2>
            </div>
            {alerts.length === 0 ? (
              <EmptyState
                title="All tracked sizes have enough stock"
                description="Set quantity above so checkout cannot oversell."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px] min-w-[640px]">
                  <thead>
                    <tr className="bg-neutral-50 text-[11px] uppercase tracking-wider text-neutral-500">
                      <th className="px-5 py-3">Product</th>
                      <th className="px-5 py-3">Color</th>
                      <th className="px-5 py-3">Size</th>
                      <th className="px-5 py-3">SKU</th>
                      <th className="px-5 py-3">Stock</th>
                      <th className="px-5 py-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {alerts.map((a, i) => (
                      <tr key={`${a.id}-${a.size}-${i}`}>
                        <td className="px-5 py-3 font-medium">{a.name}</td>
                          <td className="px-5 py-3 text-neutral-500">{a.color || "-"}</td>
                          <td className="px-5 py-3">{a.size || "?"}</td>
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
                No movements yet. They appear after checkout, cancel, return, CSV, or qty saves here.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px] min-w-[640px]">
                  <thead>
                    <tr className="bg-neutral-50 text-[11px] uppercase tracking-wider text-neutral-500">
                      <th className="px-5 py-3">When</th>
                      <th className="px-5 py-3">Product</th>
                      <th className="px-5 py-3">Color</th>
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
