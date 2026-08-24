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
};

export default function AdminAnalyticsPage() {
  const { show, Toast } = useToast();
  const [data, setData] = useState<Analytics | null>(null);
  const [days, setDays] = useState(30);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    adminFetch<Analytics>(`/api/analytics?days=${days}`)
      .then(setData)
      .catch((e) =>
        show(e instanceof AdminApiError ? e.message : "Failed to load", "error")
      )
      .finally(() => setLoading(false));
  }, [days, show]);

  const pct = (n: number, total: number) =>
    total > 0 ? Math.round((n / total) * 100) : 0;

  return (
    <div>
      {Toast}
      <PageHeader
        title="User insights"
        subtitle="On-site behavior, funnel, and product interest"
        actions={
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="border border-[var(--color-border)] px-3 py-2 text-[13px] rounded-lg bg-white"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
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
