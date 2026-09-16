"use client";
import { SkeletonAdminDashboard } from "@/components/ui/Skeleton";
import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch, downloadAdminFile } from "@/lib/admin-api";
import { PageHeader, StatCard, AdminButton, Badge, useToast } from "@/components/admin/ui";
import type { OrderDTO } from "@/lib/mappers";
import type { Product, Collection } from "@/types";

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
  const [chartsLoading, setChartsLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const { show, Toast } = useToast();

  // Core stats — fetched from simple, reliable endpoints
  const [recentOrders, setRecentOrders] = useState<OrderDTO[]>([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalOrderCount, setTotalOrderCount] = useState(0);
  const [customerCount, setCustomerCount] = useState(0);
  const [abandonedCount, setAbandonedCount] = useState(0);
  const [productCount, setProductCount] = useState(0);
  const [collectionCount, setCollectionCount] = useState(0);
  const [needsConfirmation, setNeedsConfirmation] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);
  const [outOfStockCount, setOutOfStockCount] = useState(0);

  const loadCoreData = async () => {
    setLoading(true);
    try {
      const [ordersRes, productsRes, collectionsRes, customersRes, inventoryRes] = await Promise.all([
        adminFetch<{ orders: OrderDTO[]; count: number; total?: number }>("/api/orders?limit=8"),
        adminFetch<{ products: Product[]; count: number }>("/api/products?all=1"),
        adminFetch<{ collections: Collection[] }>("/api/collections?all=1"),
        adminFetch<{ customers: any[]; count: number }>("/api/customers?limit=1"),
        adminFetch<{ lowCount: number; outCount: number }>("/api/inventory/alerts").catch(() => ({
          lowCount: 0,
          outCount: 0,
        })),
      ]);

      const orders = ordersRes?.orders || [];
      setRecentOrders(orders);
      setTotalOrderCount(ordersRes?.total || ordersRes?.count || orders.length);

      // Fetch ALL orders to compute revenue (the list API may return paginated)
        const allOrdersRes = await adminFetch<{ orders: OrderDTO[]; count: number; total?: number }>("/api/orders?limit=100");
      const allOrders = allOrdersRes?.orders || [];

      // Calculate revenue from non-cancelled orders in the time period
      const now = new Date();
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);

      let revenue = 0;
      let ordersInPeriod = 0;
      let pendingConfirmation = 0;

      allOrders.forEach(o => {
        if (o.status !== "Cancelled" && o.createdAt) {
          const orderDate = new Date(o.createdAt);
          if (orderDate >= startDate) {
            revenue += o.total || 0;
            ordersInPeriod++;
          }
        }
        if (o.status === "Confirmation Pending") {
          pendingConfirmation++;
        }
      });

      setTotalRevenue(revenue);
      setTotalOrderCount(ordersInPeriod);
      setNeedsConfirmation(pendingConfirmation);
      setLowStockCount(inventoryRes?.lowCount || 0);
      setOutOfStockCount(inventoryRes?.outCount || 0);
      setProductCount(productsRes?.products?.length || 0);
      setCollectionCount(collectionsRes?.collections?.length || 0);
      setCustomerCount(customersRes?.count || 0);

      // Count abandoned carts
      try {
        const cartsRes = await adminFetch<{ carts: any[]; count: number }>("/api/cart/sync?status=abandoned&limit=1");
        setAbandonedCount(cartsRes?.count || 0);
      } catch {
        setAbandonedCount(0);
      }
    } catch (e) {
      console.error("[dashboard] core data load failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const loadCharts = async (daysPeriod: number) => {
    setChartsLoading(true);
    try {
      const res = await adminFetch<DashboardData>(`/api/analytics/dashboard?days=${daysPeriod}`);
      if (res) setDashboardData(res);
    } catch (e) {
      console.error("[dashboard] charts load failed:", e);
      // Charts are optional — dashboard still works without them
    } finally {
      setChartsLoading(false);
    }
  };

  useEffect(() => {
    loadCoreData();
    loadCharts(days);
  }, [days]);

  const downloadCompleteAnalysis = async () => {
    setExporting(true);
    try {
      await downloadAdminFile(
        `/api/analytics/export-complete?days=${days}`,
        `complete-analysis-last-${days}-days.xlsx`
      );
      show("Excel downloaded");
    } catch (e) {
      show(e instanceof Error ? e.message : "Download failed", "error");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div>
      {Toast}
      <PageHeader
        title="Home"
        subtitle="Today’s snapshot — you pack from Orders, not here"
        actions={
          <div className="flex flex-wrap gap-3 items-center">
            <select 
              value={days} 
              onChange={e => { setDays(Number(e.target.value)); }}
              className="text-[12px] bg-white border border-[var(--color-border)] rounded-lg px-3 py-2 font-medium focus:outline-none focus:ring-1 focus:ring-black"
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
            <AdminButton
              variant="secondary"
              onClick={downloadCompleteAnalysis}
              disabled={exporting}
            >
              {exporting ? "Preparing Excel…" : "Download complete analysis (Excel)"}
            </AdminButton>
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
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              href="/admin/orders"
              className="block bg-white border border-[var(--color-border)] rounded-xl px-5 py-4 hover:border-black"
            >
              <p className="text-[11px] uppercase tracking-wider text-neutral-500">Start here</p>
              <p className="text-[15px] font-medium mt-1">Orders waiting to confirm</p>
              <p className="text-2xl font-serif mt-1">{needsConfirmation}</p>
              <p className="text-[13px] text-neutral-500 mt-1">Open Orders →</p>
            </Link>
            <Link
              href="/admin/inventory"
              className="block bg-white border border-[var(--color-border)] rounded-xl px-5 py-4 hover:border-black"
            >
              <p className="text-[11px] uppercase tracking-wider text-neutral-500">Start here</p>
              <p className="text-[15px] font-medium mt-1">Low or sold-out sizes</p>
              <p className="text-2xl font-serif mt-1">
                {lowStockCount} / {outOfStockCount}
              </p>
              <p className="text-[13px] text-neutral-500 mt-1">Open Stock →</p>
            </Link>
            <div className="bg-white border border-[var(--color-border)] rounded-xl px-5 py-4">
              <p className="text-[11px] uppercase tracking-wider text-neutral-500">Start here</p>
              <p className="text-[15px] font-medium mt-1">Recent orders</p>
              <p className="text-[13px] text-neutral-600 mt-2 leading-snug">
                Scroll down and click an order number to open it.
              </p>
            </div>
          </div>

          {/* Row 1: Key Revenue Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label={`Revenue (${days}d)`} value={`\u20B9${totalRevenue.toLocaleString("en-IN")}`} />
            <StatCard label={`Orders (${days}d)`} value={totalOrderCount} />
            <StatCard label="Customers" value={customerCount} />
            <StatCard label="Carts left unpaid" value={abandonedCount} />
          </div>

          {/* Row 2: Catalog Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Products" value={productCount} />
            <StatCard label="Collections" value={collectionCount} />
            <StatCard label="Orders waiting to confirm" value={needsConfirmation} />
            <StatCard
              label="Low / sold out"
              value={`${lowStockCount} / ${outOfStockCount}`}
              hint="Open Stock for sizes running out"
            />
          </div>

          {(lowStockCount > 0 || outOfStockCount > 0) && (
            <Link
              href="/admin/inventory"
              className="block bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 text-[13px] hover:bg-amber-100/80"
            >
              <span className="font-medium">Stock alerts:</span> {lowStockCount} low and{" "}
              {outOfStockCount} sold-out size{outOfStockCount === 1 ? "" : "s"}. Open Stock
              →
            </Link>
          )}

          {/* Charts Section */}
          {chartsLoading ? (
            <div className="text-center py-8 text-[13px] text-neutral-400">
              Loading charts...
            </div>
          ) : dashboardData ? (
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
                  <CollectionInsights data={dashboardData.abandonedCartsByCollection} title="Carts left unpaid by collection" />
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
          ) : null}

          {/* Recent Orders Table */}
          <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
              <h2 className="text-[13px] tracking-[2px] uppercase font-medium">Recent orders</h2>
              <Link href="/admin/orders" className="text-[12px] tracking-[1px] uppercase text-neutral-500 hover:text-black">
                See all
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <p className="px-5 py-10 text-[13px] text-[var(--color-text-muted)] text-center">
                No orders yet. They&apos;ll appear here after checkout.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-neutral-50/50 text-[11px] font-bold tracking-[1px] uppercase text-neutral-500">
                      <th className="px-5 py-3 font-medium">Order</th>
                      <th className="px-5 py-3 font-medium">Customer</th>
                      <th className="px-5 py-3 font-medium">Total</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border)]">
                    {recentOrders.map((o) => (
                      <tr key={o.id} className="hover:bg-neutral-50/50 transition-colors text-[13px]">
                        <td className="px-5 py-4 font-mono font-medium">
                          <Link href={`/admin/orders/${o.id}`} className="hover:underline">
                            {o.orderId}
                          </Link>
                        </td>
                        <td className="px-5 py-4">{o.customer?.name}</td>
                        <td className="px-5 py-4 font-medium">{`\u20B9${o.total?.toLocaleString("en-IN") || 0}`}</td>
                        <td className="px-5 py-4">
                          <Badge tone={["Shipped", "Delivered"].includes(o.status) ? "success" : ["Cancelled", "Returned"].includes(o.status) ? "danger" : o.status === "Confirmation Pending" ? "warning" : "info"}>
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
