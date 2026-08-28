"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import {
  PageHeader,
  AdminSelect,
  Badge,
  EmptyState,
  useToast,
} from "@/components/admin/ui";
import { ORDER_STATUSES } from "@/lib/admin-constants";
import type { OrderDTO } from "@/lib/mappers";
import { auth } from "@/lib/firebase";
import { useAppContext } from "@/context/AppContext";

export default function AdminOrdersPage() {
  const { show, Toast } = useToast();
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

  const [uploading, setUploading] = useState(false);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const load = async () => {
    setLoading(true);
    try {
      const qs = status ? `?status=${encodeURIComponent(status)}&limit=100` : "?limit=100";
      const data = await adminFetch<{ orders: OrderDTO[] }>(`/api/orders${qs}`);
      setOrders(data.orders || []);
    } catch (e) {
      show(e instanceof AdminApiError ? e.message : "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    setSelectedOrders([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

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
    const csvContent = "orderId,status,awb,courier,trackingUrl\nDH-EXAMPLE,Shipped,AWB123,Delhivery,https://delhivery.com/tracking/AWB123";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "duti_orders_bulk_update_template.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!window.confirm("Are you sure you want to bulk update orders based on this CSV? This action cannot be undone.")) {
      e.target.value = ""; // reset input
      return;
    }
    
    setUploading(true);
    try {
      const text = await file.text();
      const lines = text.split("\n").filter(l => l.trim().length > 0);
      if (lines.length < 2) throw new Error("CSV is empty or missing headers");

      const headers = lines[0].split(",").map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
      const updates = [];

      for (let i = 1; i < lines.length; i++) {
        const row = lines[i].split(",").map(col => col.trim().replace(/^"|"$/g, ''));
        const update: any = {};
        
        headers.forEach((h, idx) => {
          if (row[idx] && row[idx].trim() !== "") {
            const val = row[idx];
            if (h === "orderid") update.orderId = val;
            if (h === "status") update.status = val;
            if (h === "awb") update.awb = val;
            if (h === "courier") update.courier = val;
            if (h === "trackingurl") update.trackingUrl = val;
          }
        });

        if (update.orderId) updates.push(update);
      }

      if (updates.length === 0) throw new Error("No valid order updates found in CSV");

      const result = await adminFetch<{ successCount: number; errorCount: number; errors: string[] }>("/api/orders/bulk-update", {
        method: "POST",
        body: JSON.stringify({ updates }),
      });

      if (result.errorCount > 0) {
        show(`Updated ${result.successCount} orders. Failed: ${result.errorCount}. See console for details.`, "error");
        console.error("Bulk Update Errors:", result.errors);
      } else {
        show(`Successfully updated ${result.successCount} orders.`, "success");
      }
      load(); // refresh data
    } catch (e: any) {
      show(e.message, "error");
    } finally {
      setUploading(false);
      e.target.value = ""; // reset input
    }
  };

  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [exportStatus, setExportStatus] = useState("");
  const [exportStart, setExportStart] = useState("");
  const [exportEnd, setExportEnd] = useState("");
  const { user } = useAppContext();

  const downloadExport = async () => {
    try {
      const qs = new URLSearchParams();
      if (exportStatus) qs.set("status", exportStatus);
      if (exportStart) qs.set("startDate", exportStart);
      if (exportEnd) qs.set("endDate", exportEnd);
      
      const res = await adminFetch<{csv: string}>(`/api/orders/export?${qs.toString()}`);
      
      const blob = new Blob([res.csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `duti_orders_export_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setExportModalOpen(false);
    } catch (e: any) {
      show(e.message, "error");
    }
  };

  return (
    <div>
      {Toast}
      <PageHeader
        title="Orders"
        subtitle="Manage fulfillment and payment status"
        actions={
          <div className="flex gap-2">
            {selectedOrders.length > 0 && (
              <a
                href={`/admin/orders/bulk-invoice?ids=${selectedOrders.join(',')}`}
                target="_blank"
                rel="noreferrer"
                className="text-[12px] font-bold uppercase tracking-[1px] px-4 py-2 bg-green-600 text-white cursor-pointer hover:bg-green-700 transition-colors inline-flex items-center"
              >
                🖨️ Print {selectedOrders.length} Invoices
              </a>
            )}
            <button
              onClick={downloadTemplate}
              className="text-[12px] uppercase tracking-[1px] px-4 py-2 border hover:bg-neutral-50 transition-colors"
            >
              CSV Template
            </button>
            <button
              onClick={() => setExportModalOpen(true)}
              className="text-[12px] uppercase tracking-[1px] px-4 py-2 border hover:bg-neutral-50 transition-colors"
            >
              Export Orders
            </button>
            <label className="text-[12px] uppercase tracking-[1px] px-4 py-2 bg-black text-white cursor-pointer hover:bg-black/90 transition-colors">
              {uploading ? "Updating..." : "Bulk Update"}
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
            <h2 className="text-lg font-serif tracking-[1px] mb-4 uppercase">Export Orders</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] uppercase tracking-[1px] text-neutral-500 mb-1">Status Filter</label>
                <select value={exportStatus} onChange={e => setExportStatus(e.target.value)} className="w-full border p-2 text-sm bg-white rounded">
                  <option value="">All Statuses</option>
                  {ORDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[1px] text-neutral-500 mb-1">Start Date</label>
                <input type="date" value={exportStart} onChange={e => setExportStart(e.target.value)} className="w-full border p-2 text-sm rounded" />
              </div>
              <div>
                <label className="block text-[11px] uppercase tracking-[1px] text-neutral-500 mb-1">End Date</label>
                <input type="date" value={exportEnd} onChange={e => setExportEnd(e.target.value)} className="w-full border p-2 text-sm rounded" />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setExportModalOpen(false)} className="text-[12px] uppercase tracking-[1px] px-4 py-2 border hover:bg-neutral-50 transition-colors rounded">Cancel</button>
              <button onClick={downloadExport} className="text-[12px] uppercase tracking-[1px] px-4 py-2 bg-black text-white hover:bg-black/90 transition-colors rounded">Download CSV</button>
            </div>
          </div>
        </div>
      )}

      <div className="mb-6 max-w-xs">
        <AdminSelect
          label="Filter by status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </AdminSelect>
      </div>

      {loading ? (
        <p className="text-[13px] text-neutral-500 animate-pulse">Loading…</p>
      ) : orders.length === 0 ? (
        <EmptyState
          title="No orders"
          description="Orders from checkout will show up here."
        />
      ) : (
        <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-neutral-50 text-[11px] tracking-[1px] uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium w-10">
                    <input type="checkbox" onChange={toggleAll} checked={selectedOrders.length === orders.length && orders.length > 0} />
                  </th>
                  <th className="px-4 py-3 font-medium">Order</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Payment</th>
                  <th className="px-4 py-3 font-medium">Total</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Open</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    className={`border-t border-[var(--color-border)] hover:bg-neutral-50/80 ${selectedOrders.includes(o.orderId) ? 'bg-blue-50/50' : ''}`}
                  >
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedOrders.includes(o.orderId)} onChange={() => toggleOrder(o.orderId)} />
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px]">{o.orderId}</td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{o.customer.name}</p>
                      <p className="text-[11px] text-neutral-400">
                        {o.customer.phone}
                      </p>
                    </td>
                    <td className="px-4 py-3 capitalize">
                      {o.paymentMethod}
                      <span className="block text-[11px] text-neutral-400">
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      ₹{o.total.toLocaleString("en-IN")}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        tone={
                          o.status === "Delivered"
                            ? "success"
                            : o.status === "Cancelled" || o.status === "Returned"
                              ? "danger"
                              : "warning"
                        }
                      >
                        {o.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders/${o.orderId}`}
                        className="text-[12px] tracking-[1px] uppercase hover:underline"
                      >
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
