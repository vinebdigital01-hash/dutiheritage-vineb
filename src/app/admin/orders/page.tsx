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

export default function AdminOrdersPage() {
  const { show, Toast } = useToast();
  const [orders, setOrders] = useState<OrderDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  return (
    <div>
      {Toast}
      <PageHeader
        title="Orders"
        subtitle="Manage fulfillment and payment status"
      />

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
                    className="border-t border-[var(--color-border)] hover:bg-neutral-50/80"
                  >
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
