"use client";

import { useEffect, useState } from "react";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import {
  PageHeader,
  Badge,
  EmptyState,
  useToast,
} from "@/components/admin/ui";

type FlowKey =
  | "welcome"
  | "order_placed"
  | "order_shipped"
  | "order_delivered"
  | "cart_abandoned"
  | "post_purchase_review"
  | "winback";

const FLOW_LABELS: Record<FlowKey, { title: string; desc: string }> = {
  welcome: {
    title: "Welcome",
    desc: "Instant on first signup — WELCOME10",
  },
  order_placed: {
    title: "Order placed",
    desc: "Instant confirmation email + WhatsApp",
  },
  order_shipped: {
    title: "Order shipped",
    desc: "When status → Shipped (with tracking)",
  },
  order_delivered: {
    title: "Order delivered",
    desc: "When status → Delivered",
  },
  cart_abandoned: {
    title: "Cart abandoned",
    desc: "Cron: 1h / 24h / 72h (COMEBACK5 on 72h)",
  },
  post_purchase_review: {
    title: "Review reminder",
    desc: "Cron: ~3 days after delivery",
  },
  winback: {
    title: "Win-back",
    desc: "Cron: dormant 30d / 60d (MISSYOU15)",
  },
};

type LogRow = {
  id: string;
  flow: string;
  stage: string;
  recipientKey: string;
  channel: string;
  status: string;
  detail?: string;
  orderId?: string;
  createdAt?: string;
};

export default function AdminAutomationsPage() {
  const { show, Toast } = useToast();
  const [settings, setSettings] = useState<
    Record<FlowKey, { enabled: boolean }> | null
  >(null);
  const [logs, setLogs] = useState<LogRow[]>([]);
  const [providers, setProviders] = useState({ email: false, whatsapp: false });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminFetch<{
        settings: Record<FlowKey, { enabled: boolean }>;
        logs: LogRow[];
        providers: { email: boolean; whatsapp: boolean };
      }>("/api/settings/automations");
      setSettings(data.settings);
      setLogs(data.logs || []);
      setProviders(data.providers || { email: false, whatsapp: false });
    } catch (e) {
      show(e instanceof AdminApiError ? e.message : "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggle = async (key: FlowKey) => {
    if (!settings) return;
    const next = !settings[key]?.enabled;
    if (!window.confirm(`Are you sure you want to ${next ? "enable" : "disable"} this automation?`)) return;
    setSaving(key);
    try {
      await adminFetch("/api/settings/automations", {
        method: "PUT",
        body: JSON.stringify({ [key]: { enabled: next } }),
      });
      setSettings({ ...settings, [key]: { enabled: next } });
      show(next ? `${FLOW_LABELS[key].title} enabled` : `${FLOW_LABELS[key].title} disabled`);
    } catch (e) {
      show(e instanceof AdminApiError ? e.message : "Update failed", "error");
    } finally {
      setSaving(null);
    }
  };

  return (
    <div>
      {Toast}
      <PageHeader
        title="Automations"
        subtitle="Email + WhatsApp flows. Cron jobs need CRON_SECRET on Vercel."
      />

      <div className="flex flex-wrap gap-3 mb-8 text-[12px]">
        <Badge tone={providers.email ? "success" : "warning"}>
          Resend {providers.email ? "configured" : "not set"}
        </Badge>
        <Badge tone={providers.whatsapp ? "success" : "warning"}>
          WhatsApp {providers.whatsapp ? "configured" : "not set"}
        </Badge>
      </div>

      {loading || !settings ? (
        <p className="text-[13px] text-[var(--color-text-muted)] animate-pulse">
          Loading…
        </p>
      ) : (
        <ul className="grid md:grid-cols-2 gap-4 mb-12">
          {(Object.keys(FLOW_LABELS) as FlowKey[]).map((key) => {
            const on = settings[key]?.enabled !== false;
            return (
              <li
                key={key}
                className="bg-white border border-[var(--color-border)] rounded-xl p-5 shadow-sm flex items-start justify-between gap-4"
              >
                <div>
                  <p className="text-[14px] font-medium mb-1">
                    {FLOW_LABELS[key].title}
                  </p>
                  <p className="text-[12px] text-[var(--color-text-muted)]">
                    {FLOW_LABELS[key].desc}
                  </p>
                </div>
                <button
                  type="button"
                  disabled={saving === key}
                  onClick={() => toggle(key)}
                  className={`shrink-0 relative w-12 h-7 rounded-full transition-colors ${
                    on ? "bg-black" : "bg-neutral-300"
                  }`}
                  aria-pressed={on}
                  aria-label={`Toggle ${FLOW_LABELS[key].title}`}
                >
                  <span
                    className={`absolute top-0.5 left-0.5 w-6 h-6 rounded-full bg-white transition-transform ${
                      on ? "translate-x-5" : ""
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <h2 className="text-[13px] tracking-[2px] uppercase mb-4">Recent sends</h2>
      {logs.length === 0 ? (
        <EmptyState
          title="No automation logs yet"
          description="Logs appear after welcome, order, cart, or cron flows fire."
        />
      ) : (
        <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-neutral-50 text-[11px] uppercase tracking-wider text-neutral-500">
              <tr>
                <th className="px-4 py-3">Flow</th>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 hidden md:table-cell">When</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-3">
                    <span className="font-medium">{l.flow}</span>
                    <span className="text-neutral-400 ml-1">/{l.stage}</span>
                  </td>
                  <td className="px-4 py-3 truncate max-w-[180px]">
                    {l.recipientKey}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      tone={
                        l.status === "sent"
                          ? "success"
                          : l.status === "failed"
                            ? "danger"
                            : "neutral"
                      }
                    >
                      {l.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-neutral-500 hidden md:table-cell">
                    {l.createdAt
                      ? new Date(l.createdAt).toLocaleString("en-IN")
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
