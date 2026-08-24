"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-api";
import { PageHeader, StatCard, AdminButton, Badge } from "@/components/admin/ui";
import type { OrderDTO } from "@/lib/mappers";

type AnalyticsSummary = {
  revenue: number;
  orders: number;
  customers: { total: number; new: number };
  abandonedCarts: number;
};

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    products: 0,
    collections: 0,
    orders: 0,
    pending: 0,
    revenue: 0,
    customers: 0,
    abandonedCarts: 0,
  });
  const [recentOrders, setRecentOrders] = useState<OrderDTO[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [productsRes, collectionsRes, ordersRes, analyticsRes] =
          await Promise.all([
            adminFetch<{ count: number }>("/api/products?all=1"),
            adminFetch<{ count: number }>("/api/collections?all=1"),
            adminFetch<{ orders: OrderDTO[]; count: number }>(
              "/api/orders?limit=8"
            ),
            adminFetch<AnalyticsSummary>("/api/analytics?days=30").catch(
              () => null
            ),
          ]);
        if (cancelled) return;
        const pending = (ordersRes.orders || []).filter(
          (o) => o.status === "Confirmation Pending"
        ).length;
        setStats({
          products: productsRes.count ?? 0,
          collections: collectionsRes.count ?? 0,
          orders: analyticsRes?.orders ?? ordersRes.count ?? 0,
          pending,
          revenue: analyticsRes?.revenue ?? 0,
          customers: analyticsRes?.customers.total ?? 0,
          abandonedCarts: analyticsRes?.abandonedCarts ?? 0,
        });
        setRecentOrders(ordersRes.orders || []);
      } catch {
        /* soft fail */
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
        title="Dashboard"
        subtitle="Overview of your Duti Heritage store"
        actions={
          <>
            <Link href="/admin/analytics">
              <AdminButton variant="secondary">Insights</AdminButton>
            </Link>
            <Link href="/admin/products/new">
              <AdminButton>Add product</AdminButton>
            </Link>
            <Link href="/admin/orders">
              <AdminButton variant="secondary">View orders</AdminButton>
            </Link>
          </>
        }
      />

      {loading ? (
        <p className="text-[13px] text-[var(--color-text-muted)] animate-pulse">
          Loading metrics…
        </p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <StatCard
              label="Revenue (30d)"
              value={`₹${stats.revenue.toLocaleString("en-IN")}`}
            />
            <StatCard label="Orders (30d)" value={stats.orders} />
            <StatCard label="Customers" value={stats.customers} />
            <StatCard label="Abandoned carts" value={stats.abandonedCarts} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <StatCard label="Products" value={stats.products} />
            <StatCard label="Collections" value={stats.collections} />
            <StatCard
              label="Needs confirmation"
              value={stats.pending}
              hint="In recent list"
            />
            <StatCard label="Catalog health" value="Live" hint="Mongo connected" />
          </div>

          <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
              <h2 className="text-[13px] tracking-[2px] uppercase font-medium">
                Recent orders
              </h2>
              <Link
                href="/admin/orders"
                className="text-[12px] tracking-[1px] uppercase text-neutral-500 hover:text-black"
              >
                See all
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <p className="px-5 py-10 text-[13px] text-[var(--color-text-muted)] text-center">
                No orders yet. They’ll appear here after checkout.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px]">
                  <thead className="bg-neutral-50 text-[11px] tracking-[1px] uppercase text-neutral-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Order</th>
                      <th className="px-5 py-3 font-medium">Customer</th>
                      <th className="px-5 py-3 font-medium">Total</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((o) => (
                      <tr
                        key={o.id}
                        className="border-t border-[var(--color-border)] hover:bg-neutral-50/80"
                      >
                        <td className="px-5 py-3">
                          <Link
                            href={`/admin/orders/${o.orderId}`}
                            className="font-mono text-[12px] hover:underline"
                          >
                            {o.orderId}
                          </Link>
                        </td>
                        <td className="px-5 py-3">{o.customer.name}</td>
                        <td className="px-5 py-3">
                          ₹{o.total.toLocaleString("en-IN")}
                        </td>
                        <td className="px-5 py-3">
                          <Badge
                            tone={
                              o.status === "Delivered"
                                ? "success"
                                : o.status === "Cancelled"
                                  ? "danger"
                                  : "warning"
                            }
                          >
                            {o.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
