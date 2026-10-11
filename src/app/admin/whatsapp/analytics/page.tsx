"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { FiRefreshCw, FiMessageCircle, FiCpu, FiArrowUpRight, FiArrowDownLeft } from "react-icons/fi";

export default function WhatsAppAnalyticsPage() {
  const [stats, setStats] = useState({
    totalConversations: 0,
    activeBots: 0,
    messagesSent: 0,
    messagesReceived: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError] = useState("");

  const loadStats = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const data = await adminFetch<typeof stats>("/api/bot/analytics");
      if (data) {
        setStats(data);
        setLastUpdated(new Date());
        setError("");
      }
    } catch {
      setError("Could not load WhatsApp metrics. Please verify your admin sign-in.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const cards = [
    {
      label: "Conversations",
      value: stats.totalConversations,
      icon: FiMessageCircle,
      description: "Total unique customer chats",
    },
    {
      label: "Bot Mode",
      value: stats.activeBots,
      icon: FiCpu,
      description: "Automated AI handling active",
    },
    {
      label: "Messages Sent",
      value: stats.messagesSent,
      icon: FiArrowUpRight,
      description: "Outbound bot & admin replies",
    },
    {
      label: "Messages Received",
      value: stats.messagesReceived,
      icon: FiArrowDownLeft,
      description: "Inbound customer queries",
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl">WhatsApp Analytics</h1>
          <p className="text-[13px] text-neutral-500 mt-0.5">
            Real-time analytics and volume counts from saved chats in your store database.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[11px] text-neutral-400">
              Updated {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
          <button
            type="button"
            onClick={() => loadStats(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors w-fit"
          >
            <FiRefreshCw className={refreshing ? "animate-spin" : ""} size={12} />
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => loadStats(true)}
            className="underline font-medium hover:text-red-900 ml-2"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-neutral-500 flex items-center justify-center gap-2">
          <FiRefreshCw className="animate-spin" /> Loading WhatsApp metrics...
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {cards.map((c) => {
            const Icon = c.icon;
            return (
              <div
                key={c.label}
                className="bg-white border border-neutral-200 rounded-xl p-5 shadow-2xs hover:border-neutral-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[10px] tracking-[1.5px] uppercase font-semibold text-neutral-400">
                    {c.label}
                  </p>
                  <Icon size={16} className="text-neutral-400" />
                </div>
                <p className="font-serif text-3xl font-medium text-neutral-900 mb-1">{c.value}</p>
                <p className="text-[11px] text-neutral-500">{c.description}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
