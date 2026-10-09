"use client";
import React, { useEffect, useState } from "react";
import { PageHeader } from "@/components/admin/ui";
import { adminFetch } from "@/lib/admin-api";
import { FiMail, FiCheckCircle, FiRefreshCw } from "react-icons/fi";
import type { ReportSnapshot } from "@/lib/report-generator";

function money(n: number) {
  return `₹${Math.round(n).toLocaleString("en-IN")}`;
}

export default function ReportsPage() {
  const [loading, setLoading] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [targetEmail, setTargetEmail] = useState("");
  const [defaultHint, setDefaultHint] = useState("Loading store inbox…");
  const [snapshot, setSnapshot] = useState<ReportSnapshot | null>(null);

  const loadPreview = async () => {
    setPreviewLoading(true);
    try {
      const res = await adminFetch<{ snapshot: ReportSnapshot }>(
        "/api/reports/monthly?preview=1"
      );
      setSnapshot(res.snapshot);
    } catch {
      setSnapshot(null);
    } finally {
      setPreviewLoading(false);
    }
  };

  useEffect(() => {
    adminFetch<{ settings?: { supportEmail?: string } }>("/api/settings/store")
      .then((res) => {
        const email = String(res.settings?.supportEmail || "").trim();
        if (email) {
          setTargetEmail(email);
          setDefaultHint("From Settings → support email");
        } else {
          setDefaultHint("Add support email in Settings, or type one here");
        }
      })
      .catch(() => {
        setDefaultHint("Could not load Settings. Type the store inbox email.");
      });
    void loadPreview();
  }, []);

  const handleGenerateReport = async () => {
    setLoading(true);
    setSuccessMsg("");
    setErrorMsg("");
    try {
      const res = await adminFetch<{
        success?: boolean;
        email?: string;
        res?: { snapshot?: ReportSnapshot };
      }>("/api/reports/monthly", {
        method: "POST",
        body: JSON.stringify({ email: targetEmail.trim() || undefined }),
      });
      if (res.success) {
        setSuccessMsg(
          `Report emailed to ${res.email || targetEmail || "the store inbox"} with CSV attachments`
        );
        if (res.res?.snapshot) setSnapshot(res.res.snapshot);
        else void loadPreview();
      } else {
        setErrorMsg("Failed to generate report.");
      }
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : "Failed to generate report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Performance reports"
        subtitle="Revenue, products, cities, funnel, inventory — email + CSVs for ads and restock"
      />

      <div className="bg-white border border-[var(--color-border)] rounded-xl p-6 shadow-sm max-w-2xl mb-8">
        <h2 className="text-lg font-bold mb-2">Email monthly report</h2>
        <p className="text-sm text-neutral-500 mb-6">
          Same Performance report style as the email: snapshot, top products, reviews, cities,
          funnel, customer health, automations, inventory, quick insights. Attachments include
          product_performance, city_geo_targeting, inventory_health, and more.
        </p>

        <div className="flex flex-col gap-4 mb-6">
          <div>
            <label className="block text-[13px] font-bold text-gray-700 tracking-[1px] uppercase mb-2">
              Recipient email
            </label>
            <input
              type="email"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
              placeholder="support@yourshop.com"
              className="w-full bg-gray-50 border-2 border-gray-100 rounded-xl px-4 py-3 text-[14px] font-medium outline-none focus:border-gray-900 focus:bg-white transition-colors"
            />
            <p className="text-[12px] text-neutral-500 mt-2">{defaultHint}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => void handleGenerateReport()}
            disabled={loading}
            className={`flex items-center gap-2 py-3 px-6 rounded-xl text-[13px] font-bold tracking-[1px] uppercase transition-colors ${
              loading
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-gray-900 text-white hover:bg-black"
            }`}
          >
            {loading ? (
              "Sending…"
            ) : (
              <>
                <FiMail size={16} /> Email report
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => void loadPreview()}
            disabled={previewLoading}
            className="flex items-center gap-2 py-3 px-4 rounded-xl text-[13px] font-bold tracking-[1px] uppercase border border-neutral-200 hover:bg-neutral-50"
          >
            <FiRefreshCw size={14} /> Refresh preview
          </button>
        </div>

        {successMsg && (
          <div className="mt-6 flex items-center gap-2 p-4 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
            <FiCheckCircle size={18} />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mt-6 p-4 bg-red-50 text-red-700 rounded-lg text-sm font-medium">
            {errorMsg}
          </div>
        )}
      </div>

      <div className="bg-white border border-[var(--color-border)] rounded-xl p-6 shadow-sm max-w-3xl">
        <h2 className="text-lg font-serif tracking-[1px] uppercase mb-1">
          {snapshot
            ? `Performance report for ${snapshot.monthLabel}`
            : "Performance report preview"}
        </h2>
        <p className="text-[12px] text-neutral-500 mb-6">
          {previewLoading
            ? "Loading last 30 days…"
            : snapshot
              ? snapshot.rangeLabel
              : "Could not load preview"}
        </p>

        {snapshot ? (
          <div className="space-y-8 text-[14px]">
            <section>
              <h3 className="text-[11px] uppercase tracking-[2px] text-neutral-500 mb-3">
                Revenue Snapshot
              </h3>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2">
                <dt className="text-neutral-500">Revenue</dt>
                <dd className="text-right font-medium">{money(snapshot.revenue)}</dd>
                <dt className="text-neutral-500">Orders</dt>
                <dd className="text-right font-medium">{snapshot.orders}</dd>
                <dt className="text-neutral-500">AOV</dt>
                <dd className="text-right font-medium">{money(snapshot.aov)}</dd>
                <dt className="text-neutral-500">Prepaid / COD / Partial</dt>
                <dd className="text-right font-medium">
                  {snapshot.prepaid} / {snapshot.cod} / {snapshot.partial}
                </dd>
                <dt className="text-neutral-500">Cancelled</dt>
                <dd className="text-right font-medium">
                  {snapshot.cancelled} ({snapshot.cancelledPct})
                </dd>
                <dt className="text-neutral-500">vs Last Month</dt>
                <dd className="text-right font-medium">{snapshot.vsLastMonth}</dd>
              </dl>
            </section>

            <section>
              <h3 className="text-[11px] uppercase tracking-[2px] text-neutral-500 mb-3">
                Top products
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[13px] min-w-[480px]">
                  <thead className="text-[11px] uppercase text-neutral-500 border-b">
                    <tr>
                      <th className="py-2 pr-2">Product</th>
                      <th className="py-2 text-right">Sold</th>
                      <th className="py-2 text-right">Revenue</th>
                      <th className="py-2 text-right">Conv%</th>
                      <th className="py-2 text-right">Stock</th>
                    </tr>
                  </thead>
                  <tbody>
                    {snapshot.topProducts.map((p) => (
                      <tr key={p.name} className="border-b border-neutral-100">
                        <td className="py-2 pr-2">{p.name}</td>
                        <td className="py-2 text-right">{p.sold}</td>
                        <td className="py-2 text-right">{money(p.revenue)}</td>
                        <td className="py-2 text-right">{p.conv}</td>
                        <td className="py-2 text-right">{p.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="grid sm:grid-cols-2 gap-6">
              <div>
                <h3 className="text-[11px] uppercase tracking-[2px] text-neutral-500 mb-3">
                  Cities
                </h3>
                <ul className="space-y-1 text-[13px]">
                  {snapshot.topCities.map((c) => (
                    <li key={c.city} className="flex justify-between gap-2">
                      <span>{c.city}</span>
                      <span className="text-neutral-500">
                        {c.orders} · {money(c.revenue)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="text-[11px] uppercase tracking-[2px] text-neutral-500 mb-3">
                  Funnel & inventory
                </h3>
                <ul className="space-y-1 text-[13px] text-neutral-700">
                  <li>Abandoned carts: {snapshot.funnel.abandoned}</li>
                  <li>Abandoned value: {money(snapshot.funnel.abandonedValue)}</li>
                  <li>Out of stock: {snapshot.inventory.out}</li>
                  <li>Low stock: {snapshot.inventory.low}</li>
                  <li>Dead stock: {snapshot.inventory.dead}</li>
                </ul>
              </div>
            </section>

            <section>
              <h3 className="text-[11px] uppercase tracking-[2px] text-neutral-500 mb-3">
                Quick insights
              </h3>
              <ul className="list-disc pl-5 space-y-1 text-[13px]">
                {snapshot.insights.map((i) => (
                  <li key={i}>{i}</li>
                ))}
              </ul>
              <p className="text-[12px] text-neutral-500 mt-4">
                Email includes {snapshot.csvCount} CSV attachments for ads targeting and restock.
              </p>
            </section>
          </div>
        ) : null}
      </div>
    </div>
  );
}
