"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import { PageHeader, StatCard, Badge, useToast } from "@/components/admin/ui";

type Analytics = {
  periodDays: number;
  customers: { total: number; new: number };
  revenue: number;
  orders: number;
  avgOrderValue: number;
  abandonedCarts: number;
  funnel: {
    sessions: number;
    withCart: number;
    withCheckout: number;
    withPurchase: number;
  };
  topProducts: Array<{ productId: string; name?: string; views: number }>;
  eventCounts: Array<{ event: string; count: number }>;
  userProductViews: Array<{
    user: string;
    customerId?: string;
    productId: string;
    productName?: string;
    count: number;
    lastViewed: string;
  }>;
  recentJourneys: Array<{
    sessionId: string;
    user: string;
    lastEventAt: string;
    events: Array<{ event: string; productName?: string; path?: string }>;
  }>;
};

import { auth } from "@/lib/firebase";

export default function AdminAnalyticsPage() {
  const { show, Toast } = useToast();
  const [data, setData] = useState<Analytics | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    setLoading(true);
    adminFetch<Analytics>(`/api/analytics?days=${days}`)
      .then(setData)
      .catch((e) =>
        show(e instanceof AdminApiError ? e.message : "Failed to load", "error")
      )
      .finally(() => setLoading(false));
  }, [days, show]);

  const downloadCsv = async (endpoint: string, filename: string) => {
    try {
      setExporting(true);
      show("Generating CSV...", "success");
      const token = auth.currentUser ? await auth.currentUser.getIdToken() : "";
      const res = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to export data");
      
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", filename);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e: any) {
      show(e.message, "error");
    } finally {
      setExporting(false);
    }
  };

  const pct = (n: number, total: number) =>
    total > 0 ? Math.round((n / total) * 100) : 0;

  return (
    <div>
      {Toast}
      <PageHeader
        title="User insights"
        subtitle="On-site behavior, funnel, and product interest"
        actions={
          <div className="flex gap-2 items-center flex-wrap">
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="border border-[var(--color-border)] px-3 py-2 text-[13px] rounded-lg bg-white"
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
            <button 
              onClick={() => downloadCsv(`/api/analytics/export-insights?days=${days}`, `product-insights-${days}d.csv`)}
              disabled={exporting}
              className="px-4 py-2 text-[12px] bg-black text-white rounded-lg hover:bg-neutral-800 transition-colors tracking-wide disabled:opacity-50"
            >
              Export Product Insights
            </button>
            <button 
              onClick={() => downloadCsv(`/api/analytics/export-audience?days=${days}`, `retargeting-audience-${days}d.csv`)}
              disabled={exporting}
              className="px-4 py-2 text-[12px] border border-black text-black bg-white rounded-lg hover:bg-neutral-50 transition-colors tracking-wide disabled:opacity-50"
            >
              Export Retargeting Audience
            </button>
          </div>
        }
      />

      {loading || !data ? (
        <p className="text-[13px] animate-pulse text-neutral-500">Loading analytics…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
            <StatCard label="Revenue" value={`₹${data.revenue.toLocaleString("en-IN")}`} />
            <StatCard label="Orders" value={data.orders} />
            <StatCard label="New customers" value={data.customers.new} />
            <StatCard label="Abandoned carts" value={data.abandonedCarts} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-10">
            <div className="bg-white border border-[var(--color-border)] rounded-xl p-6 shadow-sm">
              <h2 className="text-[13px] tracking-[2px] uppercase mb-4">
                Checkout funnel
              </h2>
              <p className="text-[12px] text-neutral-500 mb-4">
                Based on tracked sessions ({data.funnel.sessions} total)
              </p>
              <ul className="space-y-3 text-[13px]">
                {[
                  { label: "Added to cart", n: data.funnel.withCart },
                  { label: "Started checkout", n: data.funnel.withCheckout },
                  { label: "Purchased", n: data.funnel.withPurchase },
                ].map((step) => (
                  <li key={step.label} className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="flex justify-between mb-1">
                        <span>{step.label}</span>
                        <span className="text-neutral-500">
                          {step.n} ({pct(step.n, data.funnel.sessions)}%)
                        </span>
                      </div>
                      <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-black rounded-full"
                          style={{
                            width: `${pct(step.n, data.funnel.sessions)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-[var(--color-border)] rounded-xl p-6 shadow-sm">
              <h2 className="text-[13px] tracking-[2px] uppercase mb-4">
                Top product views
              </h2>
              {data.topProducts.length === 0 ? (
                <p className="text-[13px] text-neutral-500">
                  No product views tracked yet. Browse the storefront to collect data.
                </p>
              ) : (
                <ul className="divide-y divide-[var(--color-border)]">
                  {data.topProducts.map((p) => (
                    <li
                      key={p.productId}
                      className="py-2.5 flex justify-between text-[13px]"
                    >
                      <span>{p.name || p.productId}</span>
                      <Badge tone="neutral">{p.views} views</Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-6 mb-10 mt-10">
            <div className="bg-white border border-[var(--color-border)] rounded-xl p-6 shadow-sm">
              <h2 className="text-[13px] tracking-[2px] uppercase mb-4 text-emerald-800">
                User Product Views (Frequency)
              </h2>
              {data.userProductViews?.length === 0 ? (
                <p className="text-[13px] text-neutral-500">No repeat product views found.</p>
              ) : (
                <ul className="divide-y divide-[var(--color-border)] max-h-80 overflow-y-auto">
                  {data.userProductViews?.map((v, i) => (
                    <li key={i} className="py-2.5 text-[13px]">
                      <div className="flex justify-between items-center mb-1">
                        <span className="font-medium">{v.user}</span>
                        <Badge tone="info">{v.count}x viewed</Badge>
                      </div>
                      <div className="text-neutral-500 text-[12px]">
                        {v.productName || v.productId}
                        <br />
                        Last viewed: {new Date(v.lastViewed).toLocaleString("en-IN")}
                      </div>
                      {v.customerId && (
                        <Link href={`/admin/customers/${v.customerId}`} className="text-blue-600 text-[11px] uppercase tracking-wider hover:underline mt-1 block">
                          View profile
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white border border-[var(--color-border)] rounded-xl p-6 shadow-sm">
              <h2 className="text-[13px] tracking-[2px] uppercase mb-4 text-amber-800">
                Recent User Journeys
              </h2>
              {data.recentJourneys?.length === 0 ? (
                <p className="text-[13px] text-neutral-500">No journeys tracked recently.</p>
              ) : (
                <ul className="divide-y divide-[var(--color-border)] max-h-80 overflow-y-auto">
                  {data.recentJourneys?.map((j, i) => {
                    // Extract a simplified path representation
                    const pathNodes = j.events.slice(-5).map(e => e.event === "product_view" && e.productName ? e.productName : e.event.replace(/_/g, " "));
                    const hasPurchase = j.events.some(e => e.event === "purchase");
                    const hasAbandonedCart = !hasPurchase && j.events.some(e => e.event === "add_to_cart");
                    
                    return (
                      <li key={i} className="py-3 text-[13px]">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium text-[12px]">{j.user}</span>
                          <Badge tone={hasPurchase ? "success" : hasAbandonedCart ? "danger" : "neutral"}>
                            {hasPurchase ? "Purchased" : hasAbandonedCart ? "Abandoned Cart" : "Browsing"}
                          </Badge>
                        </div>
                        <div className="flex gap-2 flex-wrap items-center mt-2 text-[11px]">
                          {pathNodes.map((node, idx) => (
                            <span key={idx} className="flex items-center">
                              {idx > 0 && <span className="text-neutral-300 mx-1">→</span>}
                              <span className="bg-neutral-100 px-1.5 py-0.5 rounded capitalize max-w-[120px] truncate" title={node}>{node}</span>
                            </span>
                          ))}
                        </div>
                        <p className="text-[11px] text-neutral-400 mt-2 text-right">
                          {new Date(j.lastEventAt).toLocaleString("en-IN")}
                        </p>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          <div className="bg-white border border-[var(--color-border)] rounded-xl p-6 shadow-sm">
            <h2 className="text-[13px] tracking-[2px] uppercase mb-4">
              Event breakdown
            </h2>
            <div className="flex flex-wrap gap-2">
              {data.eventCounts.map((e) => (
                <Badge key={e.event} tone="info">
                  {e.event}: {e.count}
                </Badge>
              ))}
            </div>
          </div>

          <p className="mt-8 text-[12px] text-neutral-500">
            <Link href="/admin/customers" className="underline">
              View customer profiles
            </Link>
            {" · "}
            <Link href="/admin/groups" className="underline">
              Create retargeting groups
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
