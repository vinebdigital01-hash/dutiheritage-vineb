"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import { PageHeader, AdminButton, Badge, EmptyState, useToast } from "@/components/admin/ui";
import { ActionModal } from "@/components/ActionModal";

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
  remainingRefund?: number;
  paymentMethod?: string;
  items: Array<{ name: string; size?: string; quantity: number }>;
  createdAt?: string;
};

type ModalKind =
  | { kind: "reject"; id: string }
  | { kind: "refund"; row: ReturnRow }
  | null;

export default function AdminReturnsPage() {
  const { show, Toast } = useToast();
  const [status, setStatus] = useState("");
  const [rows, setRows] = useState<ReturnRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [modal, setModal] = useState<ModalKind>(null);
  const [refundAmount, setRefundAmount] = useState("");
  const [manualConfirmed, setManualConfirmed] = useState(false);
  const [refundWithoutRestock, setRefundWithoutRestock] = useState(false);

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
      show(
        action === "restock"
          ? "Stock put back. Order status was not changed."
          : `${action} saved`
      );
      await load();
    } catch (e) {
      show(e instanceof AdminApiError ? e.message : "Failed", "error");
      throw e;
    } finally {
      setBusy(null);
    }
  };

  const remaining = (row: ReturnRow) =>
    Math.max(0, Number(row.remainingRefund ?? 0));

  return (
    <div>
      {Toast}
      <PageHeader
        title="Returns"
        subtitle="Approve first. Restock puts the size back on the shelf. Refund uses what is still left on the order — not the full total twice."
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
                    {row.customerName} · {row.customerPhone} · {row.source} ·{" "}
                    {row.type === "exchange" ? "exchange (swap)" : "return (item coming back)"}
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
                <p className="text-[13px] mb-3">Already given back on this request: ₹{row.refundAmount.toLocaleString("en-IN")}</p>
              ) : null}
              <p className="text-[12px] text-neutral-500 mb-3">
                Still left on the order: ₹{remaining(row).toLocaleString("en-IN")}
              </p>
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
                      onClick={() => setModal({ kind: "reject", id: row.id })}
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
                        setRefundAmount(String(remaining(row)));
                        setManualConfirmed(false);
                        setRefundWithoutRestock(false);
                        setModal({ kind: "refund", row });
                      }}
                    >
                      Refund
                    </AdminButton>
                  </>
                )}
              </div>
              <p className="text-[12px] text-neutral-500 mt-2">
                {row.type === "exchange"
                  ? "Exchange: restock is still allowed so that size can sell again. We do not rename the order."
                  : "Return: restock is a separate step from refund. We do not set the order to Returned for you."}{" "}
                Refund amount starts at what is still left. COD is a status note, not a bank transfer.
              </p>
            </div>
          ))}
        </div>
      )}

      <ActionModal
        isOpen={modal?.kind === "reject"}
        onClose={() => setModal(null)}
        title="Reject this return"
        description="The customer can see this reason."
        reasonLabel="Why reject"
        confirmText="Reject"
        confirmStyle="danger"
        onConfirm={async (reason) => {
          if (modal?.kind !== "reject") return;
          await act(modal.id, "reject", { reason });
        }}
      />

      <ActionModal
        isOpen={modal?.kind === "refund"}
        onClose={() => setModal(null)}
        title="Give money back"
        description={
          modal?.kind === "refund"
            ? `Default is ₹${remaining(modal.row).toLocaleString("en-IN")} still left on ${modal.row.orderId} — not the full order again.`
            : undefined
        }
        reasonLabel="Why money back"
        confirmText="Refund"
        confirmStyle="danger"
        extra={
          modal?.kind === "refund" ? (
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="text-[12px] font-bold text-gray-700 uppercase tracking-wider">
                  Amount (₹)
                </span>
                <input
                  type="number"
                  min={0}
                  className="w-full border border-gray-200 rounded-lg p-3 text-[14px] outline-none focus:ring-2 focus:ring-black"
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                />
              </label>
              {modal.row.status === "approved" && (
                <label className="flex items-start gap-2 text-[13px] text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={refundWithoutRestock}
                    onChange={(e) => setRefundWithoutRestock(e.target.checked)}
                  />
                  <span>
                    Refund without restock yet — I know the size is not back on the shelf.
                  </span>
                </label>
              )}
              {modal.row.paymentMethod !== "cod" && (
                <label className="flex items-start gap-2 text-[13px] text-neutral-700 cursor-pointer">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={manualConfirmed}
                    onChange={(e) => setManualConfirmed(e.target.checked)}
                  />
                  <span>
                    I already paid them outside Razorpay (cash / UPI / bank), or this is a COD note.
                  </span>
                </label>
              )}
            </div>
          ) : null
        }
        onConfirm={async (reason) => {
          if (modal?.kind !== "refund") return;
          const row = modal.row;
          const left = remaining(row);
          const amount = refundAmount === "" ? left : Number(refundAmount);
          if (row.status === "approved" && !refundWithoutRestock) {
            throw new Error("Tick “refund without restock” or put stock back first.");
          }
          await act(row.id, "refund", {
            reason: reason || row.reason,
            amount,
            manualConfirmed: row.paymentMethod === "cod" ? false : manualConfirmed,
            refundWithoutRestock: row.status === "approved" ? refundWithoutRestock : false,
          });
        }}
      />
    </div>
  );
}
