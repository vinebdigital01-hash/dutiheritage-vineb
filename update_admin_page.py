new_page = """"use client";
import { SkeletonAdminDashboard } from "@/components/ui/Skeleton";
import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch } from "@/lib/admin-api";
import { PageHeader, StatCard, AdminButton, Badge } from "@/components/admin/ui";
import type { OrderDTO } from "@/lib/mappers";

// Import all charts
import {
  RevenueChart,
  OrdersChart,
  TopProductsChart,
  CollectionInsights,
  ConversionFunnel,
  PaymentSplit,
  CustomerAcquisition
} from "@/components/admin/charts";

type DashboardData = {
  trends: any[];
  paymentSplit: any[];
  topProducts: any[];
  topCollections: any[];
  abandonedCartsByCollection: any[];
  conversionFunnel: any[];
  customerAcquisition: any[];
};

export default function AdminDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderDTO[]>([]);

  const loadData = async (daysPeriod: number) => {
    setLoading(true);
    try {
      const [analyticsRes, ordersRes] = await Promise.all([
        adminFetch<DashboardData>(`/api/analytics/dashboard?days=${daysPeriod}`).catch(() => null),
        adminFetch<{ orders: OrderDTO[]; count: number }>("/api/orders?limit=8")
      ]);
      
      if (analyticsRes) setDashboardData(analyticsRes);
      if (ordersRes) setRecentOrders(ordersRes.orders || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(days);
  }, [days]);

  // Aggregate stats
  const totalRevenue = dashboardData?.trends.reduce((sum, t) => sum + t.revenue, 0) || 0;
  const totalOrders = dashboardData?.trends.reduce((sum, t) => sum + t.orders, 0) || 0;
  const totalCustomers = dashboardData?.customerAcquisition.reduce((sum, c) => sum + c.new, 0) || 0;
  const totalAbandoned = dashboardData?.abandonedCartsByCollection.reduce((sum, c) => sum + c.abandonments, 0) || 0;

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle="Overview of your Duti Heritage store"
        actions={
          <div className="flex gap-3 items-center">
            <select 
              value={days} 
              onChange={e => setDays(Number(e.target.value))}
              className="text-[12px] bg-white border border-[var(--color-border)] rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-1 focus:ring-black"
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
            <Link href="/admin/products/new">
              <AdminButton>Add product</AdminButton>
            </Link>
          </div>
        }
      />

      {loading ? (
        <SkeletonAdminDashboard />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label={`Revenue (${days}d)`} value={`₹${totalRevenue.toLocaleString("en-IN")}`} />
            <StatCard label={`Orders (${days}d)`} value={totalOrders} />
            <StatCard label="New Customers" value={totalCustomers} />
            <StatCard label="Abandoned Carts" value={totalAbandoned} />
          </div>

          {dashboardData && (
            <>
              {/* Main Trends */}
              <div className="grid lg:grid-cols-2 gap-6">
                <RevenueChart data={dashboardData.trends} />
                <OrdersChart data={dashboardData.trends} />
              </div>

              {/* Products & Collections */}
              <div className="grid lg:grid-cols-2 gap-6">
                <TopProductsChart data={dashboardData.topProducts} />
                <div className="grid grid-rows-2 gap-6">
                  <CollectionInsights data={dashboardData.topCollections} title="Top Collections (Views)" />
                  <CollectionInsights data={dashboardData.abandonedCartsByCollection} title="Abandoned Carts by Collection" />
                </div>
              </div>

              {/* Behavior & Acquisition */}
              <div className="grid lg:grid-cols-3 gap-6">
                <ConversionFunnel data={dashboardData.conversionFunnel} />
                <PaymentSplit data={dashboardData.paymentSplit} />
                <div className="lg:col-span-3">
                  <CustomerAcquisition data={dashboardData.customerAcquisition} />
                </div>
              </div>
            </>
          )}

          {/* Recent Orders Table */}
          <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm mt-8">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
              <h2 className="text-[13px] tracking-[2px] uppercase font-medium">Recent orders</h2>
              <Link href="/admin/orders" className="text-[12px] tracking-[1px] uppercase text-neutral-500 hover:text-black">
                See all
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <p className="px-5 py-10 text-[13px] text-[var(--color-text-muted)] text-center">
                No orders yet. They'll appear here after checkout.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {recentOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-neutral-50/50 transition-colors text-[13px]">
                        <td className="px-5 py-4 font-mono font-medium">{o.orderId}</td>
                        <td className="px-5 py-4">{new Date(o.createdAt).toLocaleDateString("en-GB")}</td>
                        <td className="px-5 py-4">{o.customer?.name}</td>
                        <td className="px-5 py-4 font-medium">₹{o.total?.toLocaleString("en-IN") || 0}</td>
                        <td className="px-5 py-4">
                          <Badge status={o.paymentStatus === "paid" ? "success" : o.paymentStatus === "failed" ? "error" : "warning"}>
                            {o.paymentStatus}
                          </Badge>
                        </td>
                        <td className="px-5 py-4">
                          <Badge status={["Shipped", "Delivered"].includes(o.status) ? "success" : ["Cancelled", "Returned"].includes(o.status) ? "error" : "info"}>
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
        </div>
      )}
    </div>
  );
}
"""

with open("src/app/admin/page.tsx", "w", encoding="utf-8") as f:
    f.write(new_page)
print("Updated AdminDashboardPage")
