"use client";

import { useCallback, useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { PageHeader, EmptyState } from "@/components/admin/ui";

type AuditRow = {
  id: string;
  actor: string;
  role: string;
  action: string;
  resource: string;
  resourceId: string;
  message: string;
  path: string;
  ip: string;
  createdAt?: string;
};

export default function AdminAuditPage() {
  const [q, setQ] = useState("");
  const [applied, setApplied] = useState("");
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AuditRow[]>([]);
  const [total, setTotal] = useState(0);
  const limit = 50;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (applied) params.set("q", applied);
      const res = await adminFetch<{ items: AuditRow[]; total: number }>(
        `/api/admin/audit?${params}`
      );
      setItems(res.items || []);
      setTotal(res.total || 0);
    } catch (e) {
      console.error("[audit]", e);
    } finally {
      setLoading(false);
    }
  }, [applied, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const pages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <PageHeader
        title="Who changed what"
        subtitle="Staff history — not the customer’s parcel tracking"
      />

      <form
        className="mb-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setApplied(q.trim());
        }}
      >
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search actor, action, resource, id…"
          className="flex-1 border border-neutral-200 rounded-lg px-3 py-2 text-[13px]"
        />
        <button
          type="submit"
          className="px-4 py-2 text-[13px] bg-neutral-900 text-white rounded-lg"
        >
          Search
        </button>
      </form>

      {loading ? (
        <p className="text-[13px] text-neutral-500 animate-pulse">Loading…</p>
      ) : items.length === 0 ? (
        <EmptyState title="Nothing logged yet" description="When staff change an order, product, or setting, it will show here." />
      ) : (
        <div className="bg-white border border-neutral-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] text-neutral-700">
              <thead className="bg-neutral-50 border-b border-neutral-200 text-[11px] uppercase tracking-wider font-semibold text-neutral-500">
                <tr>
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Resource</th>
                  <th className="px-4 py-3">Message</th>
                </tr>
              </thead>
              <tbody>
                {items.map((row) => (
                  <tr key={row.id} className="border-t border-neutral-100">
                    <td className="px-4 py-3 whitespace-nowrap text-neutral-500">
                      {row.createdAt
                        ? new Date(row.createdAt).toLocaleString("en-IN")
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div>{row.actor}</div>
                      {row.role ? (
                        <div className="text-[11px] text-neutral-400">{row.role}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 uppercase tracking-wide text-[11px] font-semibold">
                      {row.action}
                    </td>
                    <td className="px-4 py-3">
                      <div>{row.resource}</div>
                      {row.resourceId ? (
                        <div className="text-[11px] text-neutral-400 font-mono">
                          {row.resourceId}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-neutral-600 max-w-md">
                      {row.message || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {pages > 1 ? (
            <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100 text-[12px] text-neutral-500">
              <span>
                {total} entries · page {page} of {pages}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1 border rounded disabled:opacity-40"
                >
                  Prev
                </button>
                <button
                  type="button"
                  disabled={page >= pages}
                  onClick={() => setPage((p) => Math.min(pages, p + 1))}
                  className="px-3 py-1 border rounded disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
