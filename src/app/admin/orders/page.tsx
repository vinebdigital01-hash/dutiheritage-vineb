"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import {
  PageHeader,
  AdminSelect,
  AdminInput,
  AdminButton,
  Badge,
  EmptyState,
  useToast,
} from "@/components/admin/ui";
import { ORDER_STATUSES } from "@/lib/admin-constants";
import type { OrderDTO } from "@/lib/mappers";
import { ActionModal } from "@/components/ActionModal";
import { useConfirm, ConfirmModal } from "@/components/ConfirmDialog";

type ListResponse = {
  orders: OrderDTO[];
  count: number;
  total: number;
  page: number;
  pageSize: number;
  pages: number;
};

function statusTone(status: string): "success" | "danger" | "warning" | "info" {
  if (status === "Delivered") return "success";
  if (status === "Cancelled" || status === "Returned") return "danger";
  if (status === "On Hold" || status === "Confirmation Pending") return "warning";
  return "info";
}

export default function AdminOrdersPage() {
  const { show, Toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [pendingUpload, setPendingUpload] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [qInput, setQInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [cancelRequestsOnly, setCancelRequestsOnly] = useState(false);
  const [city, setCity] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusModal, setStatusModal] = useState<{
    order: OrderDTO;
    next: "On Hold" | "Cancelled";
  } | null>(null);

  const [uploading, setUploading] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("limit", "25");
      if (status) qs.set("status", status);
      if (q.trim()) qs.set("q", q.trim());
      if (paymentMethod) qs.set("paymentMethod", paymentMethod);
      if (cancelRequestsOnly) qs.set("cancelRequestState", "requested");
      if (city.trim()) qs.set("city", city.trim());
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);
      const data = await adminFetch<ListResponse>(`/api/orders?${qs.toString()}`);
      setOrders(data.orders || []);
      setPages(data.pages || 1);
      setTotal(data.total || 0);
    } catch (e) {
      show(e instanceof AdminApiError ? e.message : "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  }, [page, status, q, paymentMethod, cancelRequestsOnly, city, from, to, show]);

  useEffect(() => {
    load();
    setSelectedOrders([]);
  }, [load]);

  const applySearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setQ(qInput);
  };

  const applyQuickStatus = async (order: OrderDTO, next: string, reason = "") => {
    setBusyId(order.orderId);
    try {
      await adminFetch(`/api/orders/${order.orderId}`, {
        method: "PUT",
        body: JSON.stringify({ status: next, reason }),
      });
      show(`${order.orderId} → ${next}`);
      await load();
    } catch (e) {
      const msg = e instanceof AdminApiError ? e.message : "Update failed";
      show(msg, "error");
      throw new Error(msg);
    } finally {
      setBusyId(null);
    }
  };

  const quickStatus = async (order: OrderDTO, next: string) => {
    if (next === "Cancelled" || next === "On Hold") {
      setStatusModal({ order, next });
      return;
    }
    const ok = await confirm({
      title: "Confirm order",
      description: `Mark ${order.orderId} as confirmed? The customer can be notified.`,
      confirmText: "Confirm order",
    });
    if (!ok) return;
    try {
      await applyQuickStatus(order, next);
    } catch {
      /* toast already shown */
    }
  };

  const toggleAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedOrders(orders.map((o) => o.orderId));
    else setSelectedOrders([]);
  };

  const toggleOrder = (orderId: string) => {
    if (selectedOrders.includes(orderId)) {
      setSelectedOrders(selectedOrders.filter((id) => id !== orderId));
    } else {
      setSelectedOrders([...selectedOrders, orderId]);
    }
  };

  const downloadTemplate = () => {
    const csvContent =
      "orderId,status,awb,courier,trackingUrl\nDH-EXAMPLE,Shipped,AWB123,Delhivery,https://delhivery.com/tracking/AWB123";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "duti_orders_bulk_update_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const runBulkUpload = async (file: File) => {
    setUploading(true);
    try {
      const text = await file.text();
      const lines = text.split("\n").filter((l) => l.trim().length > 0);
      if (lines.length < 2) throw new Error("Spreadsheet is empty or missing headers");

      const headers = lines[0]
        .split(",")
        .map((h) => h.trim().replace(/^"|"$/g, "").toLowerCase());
      const updates = [];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(",").map((col) => col.trim().replace(/^"|"$/g, ""));
        const update: Record<string, string> = {};

        headers.forEach((h, idx) => {
          if (row[idx] && row[idx].trim() !== "") {
            const val = row[idx];
            if (h === "orderid") update.orderId = val;
            if (h === "status") update.status = val;
            if (h === "awb" || h === "trackingnumber") update.awb = val;
            if (h === "courier") update.courier = val;
            if (h === "trackingurl") update.trackingUrl = val;
          }
        });

        if (update.orderId) updates.push(update);
      }

      if (updates.length === 0) throw new Error("No valid order rows in this spreadsheet");

      const result = await adminFetch<{
        successCount: number;
        errorCount: number;
        errors: string[];
      }>("/api/orders/bulk-update", {
        method: "POST",
        body: JSON.stringify({ updates }),
      });

      if (result.errorCount > 0) {
        show(
          `Updated ${result.successCount} orders. Failed: ${result.errorCount}. See console for details.`,
          "error"
        );
        console.error("Bulk Update Errors:", result.errors);
      } else {
        show(`Successfully updated ${result.successCount} orders.`, "success");
      }
      load();
    } catch (e: unknown) {
      show(e instanceof Error ? e.message : "Upload failed", "error");
    } finally {
      setUploading(false);
      setPendingUpload(null);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPendingUpload(file);
  };

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportStatus, setExportStatus] = useState("");
  const [exportStart, setExportStart] = useState("");
  const [exportEnd, setExportEnd] = useState("");
  const [exportPayment, setExportPayment] = useState("");

  const downloadExport = async () => {
    try {
      const qs = new URLSearchParams();
      if (exportStatus) qs.set("status", exportStatus);
      if (exportStart) qs.set("startDate", exportStart);
      if (exportEnd) qs.set("endDate", exportEnd);
      if (exportPayment) qs.set("paymentMethod", exportPayment);

      const res = await adminFetch<{ csv: string }>(`/api/orders/export?${qs.toString()}`);

      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `duti_orders_export_${new Date().toISOString().split("T")[0]}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportModalOpen(false);
    } catch (e: unknown) {
      show(e instanceof Error ? e.message : "Export failed", "error");
    }
  };

  return (
    <div>
      {Toast}
      {ConfirmDialog}
      <ConfirmModal
        isOpen={Boolean(pendingUpload)}
        title="Upload spreadsheet"
        description="This will change many orders and cannot be undone. Continue only if your CSV is correct."
        confirmText="Upload & update"
        confirmStyle="danger"
        onClose={() => setPendingUpload(null)}
        onConfirm={async () => {
          if (pendingUpload) await runBulkUpload(pendingUpload);
        }}
      />
      <PageHeader
        title="Orders"
        subtitle={`${total.toLocaleString("en-IN")} orders · Find → confirm → when you ship, add tracking`}
        actions={
          <div className="flex gap-2 flex-wrap">
            {selectedOrders.length > 0 && (
              <a
                href={`/admin/orders/bulk-invoice?ids=${selectedOrders.join(",")}`}
                target="_blank"
                rel="noreferrer"
                className="text-[12px] font-bold uppercase tracking-[1px] px-4 py-2 bg-green-600 text-white cursor-pointer hover:bg-green-700 transition-colors inline-flex items-center rounded-lg"
              >
                Print {selectedOrders.length} invoices
              </a>
            )}
            <button
              onClick={downloadTemplate}
              className="text-[12px] uppercase tracking-[1px] px-4 py-2 border hover:bg-neutral-50 transition-colors rounded-lg"
            >
              Download spreadsheet template
            </button>
            <button
              onClick={() => setExportModalOpen(true)}
              className="text-[12px] uppercase tracking-[1px] px-4 py-2 border hover:bg-neutral-50 transition-colors rounded-lg"
            >
              Download orders (Excel/CSV)
            </button>
            <label className="text-[12px] uppercase tracking-[1px] px-4 py-2 bg-black text-white cursor-pointer hover:bg-black/90 transition-colors rounded-lg">
              {uploading ? "Uploading…" : "Upload spreadsheet"}
              <input
                type="file"
                accept=".csv"
                className="hidden"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </div>
        }
      />

      {exportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white p-6 max-w-sm w-full rounded-xl shadow-lg">
            <h2 className="text-lg font-serif tracking-[1px] mb-4 uppercase">Download orders</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-[1px] text-neutral-500 mb-1">
                  Status
                </label>
                <select
                  value={exportStatus}
                  onChange={(e) => setExportStatus(e.target.value)}
                  className="w-full border p-2 text-sm bg-white rounded"
                >
                  <option value="">All Statuses</option>
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[1px] text-neutral-500 mb-1">
                  From date
                </label>
                <input
                  type="date"
                  value={exportStart}
                  onChange={(e) => setExportStart(e.target.value)}
                  className="w-full border p-2 text-sm rounded"
                />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[1px] text-neutral-500 mb-1">
                  To date
                </label>
                <input
                  type="date"
                  value={exportEnd}
                  onChange={(e) => setExportEnd(e.target.value)}
                  className="w-full border p-2 text-sm rounded"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setExportModalOpen(false)}
                className="text-[12px] uppercase tracking-[1px] px-4 py-2 border hover:bg-neutral-50 transition-colors rounded"
              >
                Close
              </button>
              <button
                onClick={downloadExport}
                className="text-[12px] uppercase tracking-[1px] px-4 py-2 bg-black text-white hover:bg-black/90 transition-colors rounded"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      <form
        onSubmit={applySearch}
        className="mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 bg-white border border-[var(--color-border)] rounded-xl p-4"
      >
        <div className="xl:col-span-2">
          <AdminInput
            label="Search"
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="Order number, phone, email, name, or tracking number"
          />
        </div>
        <AdminSelect
          label="Status"
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </AdminSelect>
        <AdminSelect
          label="Payment"
          value={paymentMethod}
          onChange={(e) => {
            setPage(1);
            setPaymentMethod(e.target.value);
          }}
        >
          <option value="">All methods</option>
          <option value="cod">COD</option>
          <option value="prepaid">Prepaid</option>
          <option value="partial">Partial</option>
        </AdminSelect>
        <div className="flex items-end">
          <button
            type="button"
            onClick={() => {
              setPage(1);
              setCancelRequestsOnly((v) => !v);
            }}
            className={`w-full text-[12px] uppercase tracking-[1px] px-3 py-2.5 rounded-lg border transition-colors ${
              cancelRequestsOnly
                ? "bg-amber-600 text-white border-amber-600"
                : "bg-white border-neutral-200 hover:bg-amber-50 text-amber-900"
            }`}
          >
            {cancelRequestsOnly ? "Cancel queue on" : "Cancel requests"}
          </button>
        </div>
        <AdminInput
          label="City"
          value={city}
          onChange={(e) => {
            setPage(1);
            setCity(e.target.value);
          }}
          placeholder="Delhi"
        />
        <div className="flex items-end gap-2">
          <AdminButton type="submit" className="w-full">
            Search
          </AdminButton>
        </div>
        <AdminInput
          label="From"
          type="date"
          value={from}
          onChange={(e) => {
            setPage(1);
            setFrom(e.target.value);
          }}
        />
        <AdminInput
          label="To"
          type="date"
          value={to}
          onChange={(e) => {
            setPage(1);
            setTo(e.target.value);
          }}
        />
      </form>

      {loading ? (
        <p className="text-[13px] text-neutral-500 animate-pulse">Loading…</p>
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders match"
          description="New checkouts will show here."
        />
      ) : (
        <div className="space-y-4">
          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {orders.map((o) => (
              <div
                key={o.id}
                className={`bg-white border border-[var(--color-border)] rounded-xl p-4 ${
                  selectedOrders.includes(o.orderId) ? "ring-2 ring-blue-200" : ""
                }`}
              >
                <div className="flex items-start gap-3 mb-3">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={selectedOrders.includes(o.orderId)}
                    onChange={() => toggleOrder(o.orderId)}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <p className="font-mono text-[13px] font-medium">{o.orderId}</p>
                      <Badge tone={statusTone(o.status)}>{o.status}</Badge>
                      {o.cancelRequestState === "requested" ? (
                        <Badge tone="warning">Cancel request</Badge>
                      ) : null}
                    </div>
                    <p className="text-[14px] font-medium truncate">{o.customer.name}</p>
                    <p className="text-[12px] text-neutral-500">
                      {o.customer.phone}
                      {o.customer.city ? ` · ${o.customer.city}` : ""}
                    </p>
                    <p className="text-[13px] mt-1">
                      ₹{o.total.toLocaleString("en-IN")} ·{" "}
                      <span className="capitalize">{o.paymentMethod}</span>
                    </p>
                    {o.trackingInfo?.awb ? (
                      <p className="text-[11px] font-mono text-neutral-500 mt-1">
                        AWB {o.trackingInfo.awb}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-2 pt-2 border-t border-neutral-100">
                  {o.status === "Confirmation Pending" || o.status === "On Hold" ? (
                    <button
                      type="button"
                      disabled={busyId === o.orderId}
                      onClick={() => void quickStatus(o, "Confirmed")}
                      className="text-[11px] uppercase tracking-[1px] text-emerald-700 font-medium disabled:opacity-40"
                    >
                      Confirm
                    </button>
                  ) : null}
                  {o.status !== "Cancelled" &&
                  o.status !== "Delivered" &&
                  o.status !== "Returned" &&
                  o.status !== "On Hold" ? (
                    <button
                      type="button"
                      disabled={busyId === o.orderId}
                      onClick={() => void quickStatus(o, "On Hold")}
                      className="text-[11px] uppercase tracking-[1px] text-amber-700 font-medium disabled:opacity-40"
                    >
                      Pause
                    </button>
                  ) : null}
                  {o.status !== "Cancelled" && o.status !== "Delivered" ? (
                    <button
                      type="button"
                      disabled={busyId === o.orderId}
                      onClick={() => void quickStatus(o, "Cancelled")}
                      className="text-[11px] uppercase tracking-[1px] text-red-600 font-medium disabled:opacity-40"
                    >
                      Cancel
                    </button>
                  ) : null}
                  <Link
                    href={`/admin/orders/${o.orderId}`}
                    className="text-[11px] uppercase tracking-[1px] font-medium ml-auto"
                  >
                    Open
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] min-w-[900px]">
                <thead className="bg-neutral-50 text-[11px] tracking-[1px] uppercase text-neutral-500">
                  <tr>
                    <th className="px-4 py-3 font-medium w-10">
                      <input
                        type="checkbox"
                        onChange={toggleAll}
                        checked={selectedOrders.length === orders.length && orders.length > 0}
                      />
                    </th>
                    <th className="px-4 py-3 font-medium">Order</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">City</th>
                    <th className="px-4 py-3 font-medium">Payment</th>
                    <th className="px-4 py-3 font-medium">Total</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Tracking number</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr
                      key={o.id}
                      className={`border-t border-[var(--color-border)] hover:bg-neutral-50/80 ${selectedOrders.includes(o.orderId) ? "bg-blue-50/50" : ""}`}
                    >
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedOrders.includes(o.orderId)}
                          onChange={() => toggleOrder(o.orderId)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-mono text-[12px]">{o.orderId}</p>
                        <p className="text-[11px] text-neutral-400">
                          {o.createdAt
                            ? new Date(o.createdAt).toLocaleString("en-IN")
                            : ""}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium">{o.customer.name}</p>
                        <p className="text-[11px] text-neutral-400">{o.customer.phone}</p>
                      </td>
                      <td className="px-4 py-3 text-neutral-600">
                        {o.customer.city}
                        <span className="block text-[11px] text-neutral-400">
                          {o.customer.pinCode}
                        </span>
                      </td>
                      <td className="px-4 py-3 capitalize">
                        {o.paymentMethod}
                        <span className="block text-[11px] text-neutral-400">
                          {o.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3">₹{o.total.toLocaleString("en-IN")}</td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1 items-start">
                          <Badge tone={statusTone(o.status)}>{o.status}</Badge>
                          {o.cancelRequestState === "requested" ? (
                            <Badge tone="warning">Cancel request</Badge>
                          ) : null}
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-[11px] text-neutral-500">
                        {o.trackingInfo?.awb || "—"}
                      </td>
                      <td className="px-4 py-3 text-right space-x-2 whitespace-nowrap">
                        {o.status === "Confirmation Pending" || o.status === "On Hold" ? (
                          <button
                            type="button"
                            disabled={busyId === o.orderId}
                            onClick={() => void quickStatus(o, "Confirmed")}
                            className="text-[11px] uppercase tracking-[1px] text-emerald-700 hover:underline disabled:opacity-40"
                          >
                            Confirm order
                          </button>
                        ) : null}
                        {o.status !== "Cancelled" &&
                        o.status !== "Delivered" &&
                        o.status !== "Returned" &&
                        o.status !== "On Hold" ? (
                          <button
                            type="button"
                            disabled={busyId === o.orderId}
                            onClick={() => void quickStatus(o, "On Hold")}
                            className="text-[11px] uppercase tracking-[1px] text-amber-700 hover:underline disabled:opacity-40"
                          >
                            Pause order
                          </button>
                        ) : null}
                        {o.status !== "Cancelled" && o.status !== "Delivered" ? (
                          <button
                            type="button"
                            disabled={busyId === o.orderId}
                            onClick={() => void quickStatus(o, "Cancelled")}
                            className="text-[11px] uppercase tracking-[1px] text-red-600 hover:underline disabled:opacity-40"
                          >
                            Cancel order
                          </button>
                        ) : null}
                        <Link
                          href={`/admin/orders/${o.orderId}`}
                          className="text-[11px] tracking-[1px] uppercase hover:underline font-medium"
                        >
                          Open order
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between px-1 py-2 text-[12px] text-neutral-500">
            <span>
              Page {page} of {pages}
            </span>
            <div className="flex gap-2">
              <AdminButton
                variant="secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </AdminButton>
              <AdminButton
                variant="secondary"
                disabled={page >= pages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </AdminButton>
            </div>
          </div>
        </div>
      )}
      <ActionModal
        isOpen={Boolean(statusModal)}
        onClose={() => setStatusModal(null)}
        title={statusModal?.next === "On Hold" ? "Pause this order" : "Cancel this order"}
        description={
          statusModal
            ? `${statusModal.order.orderId} — the customer can be notified.`
            : undefined
        }
        reasonLabel={statusModal?.next === "On Hold" ? "Why pause" : "Why cancel"}
        confirmText={statusModal?.next === "On Hold" ? "Pause" : "Cancel order"}
        confirmStyle={statusModal?.next === "Cancelled" ? "danger" : "primary"}
        onConfirm={async (reason) => {
          if (!statusModal) return;
          await applyQuickStatus(statusModal.order, statusModal.next, reason);
        }}
      />
    </div>
  );
}
