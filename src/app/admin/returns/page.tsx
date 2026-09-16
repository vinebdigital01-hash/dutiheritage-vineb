"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import { PageHeader, AdminButton, Badge, EmptyState, useToast } from "@/components/admin/ui";

type ReturnRow = {
  id: string;
  orderId: string;
  type: string;
  status: string;
  source: string;
  reason: string;
  rejectReason?: string;
  customerName: string;
  customerPhone: string;
  refundAmount: number;
  items: Array<{ name: string; size?: string; quantity: number }>;
  createdAt?: string;
};

export default function AdminReturnsPage() {
  const { show, Toast } = useToast();
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<ReturnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const params = status ? `?status=${encodeURIComponent(status)}` : "";
      const data = await adminFetch<{ returns: ReturnRow[] }>(`/api/returns${params}`);
      setRows(data.returns || []);
    } catch (e) {
      show(e instanceof AdminApiError ? e.message : "Load failed", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const act = async (id: string, action: string, extra?: Record<string, unknown>) => {
    setBusy(id + action);
    try {
      await adminFetch(`/api/returns/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ action, ...extra }),
      });
      show(`${action} saved`);
      await load();
    } catch (e) {
      show(e instanceof AdminApiError ? e.message : "Failed", "error");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div>
      {Toast}
      <PageHeader
        title="Returns"
        subtitle="Customer wants the item back — approve, put stock back, then refund if needed"
      />
      <div className="flex flex-wrap gap-2 mb-6">
        {["", "requested", "approved", "rejected", "restocked"].map((s) => (
          <button
            key={s || "all"}
            type="button"
            onClick={() => setStatus(s)}
            className={`px-3 py-1.5 text-[12px] rounded-lg border ${
              status === s ? "bg-black text-white border-black" : "bg-white border-neutral-200"
            }`}
          >
            {s || "All"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-[13px] text-neutral-500 animate-pulse">Loading…</p>
      ) : rows.length === 0 ? (
        <EmptyState title="No return requests" description="Delivered orders can be sent here from the order page or customer account." />
      ) : (
        <div className="space-y-4">
          {rows.map((row) => (
            <div key={row.id} className="bg-white border border-neutral-200 rounded-xl p-5 shadow-sm">
              <div className="flex flex-wrap justify-between gap-3 mb-3">
                <div>
                  <Link href={`/admin/orders/${row.orderId}`} className="font-medium underline">
                    {row.orderId}
                  </Link>
                  <p className="text-[13px] text-neutral-500">
                    {row.customerName} · {row.customerPhone} · {row.source} {row.type}
                  </p>
                </div>
                <Badge tone={row.status === "requested" ? "warning" : row.status === "rejected" ? "danger" : "success"}>
                  {row.status}
                </Badge>
              </div>
              <p className="text-[13px] mb-2">{row.reason}</p>
              <ul className="text-[13px] text-neutral-600 mb-4">
                {row.items.map((item, i) => (
                  <li key={i}>
                    {item.name} {item.size ? `(${item.size})` : ""} × {item.quantity}
                  </li>
                ))}
              </ul>
              {row.refundAmount > 0 ? (
                <p className="text-[13px] mb-3">Refunded ₹{row.refundAmount.toLocaleString("en-IN")}</p>
              ) : null}
              <div className="flex flex-wrap gap-2">
                {row.status === "requested" && (
                  <>
                    <AdminButton
                      disabled={!!busy}
                      onClick={() => act(row.id, "approve")}
                    >
                      Approve
                    </AdminButton>
                    <AdminButton
                      variant="danger"
                      disabled={!!busy}
                      onClick={() => {
                        const reason = window.prompt("Why are you rejecting this return?");
                        if (reason) void act(row.id, "reject", { reason });
                      }}
                    >
                      Reject
                    </AdminButton>
                  </>
                )}
                {(row.status === "approved" || row.status === "restocked") && (
                  <>
                    {row.status === "approved" && (
                      <AdminButton
                        variant="secondary"
                        disabled={!!busy}
                        onClick={() => act(row.id, "restock")}
                      >
                        Restock
                      </AdminButton>
                    )}
                    <AdminButton
                      variant="secondary"
                      disabled={!!busy}
                      onClick={() => {
                        const amount = window.prompt("How much to give back (₹)? Leave empty for the remaining total.");
                        const reason = window.prompt("Why money back?", row.reason) || row.reason;
                        const payload: Record<string, unknown> = { reason };
                        if (amount && Number(amount) > 0) payload.amount = Number(amount);
                        void act(row.id, "refund", payload);
                      }}
                    >
                      Refund
                    </AdminButton>
                  </>
                )}
              </div>
              <p className="text-[12px] text-neutral-500 mt-2">
                Approve = yes. Restock = that size can sell again. Refund = give money back.
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
