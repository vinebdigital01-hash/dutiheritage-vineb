"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { FiRefreshCw, FiSearch, FiMessageSquare } from "react-icons/fi";

type Log = {
  id: string;
  phone: string;
  sentBy?: string;
  direction?: string;
  body: string;
  createdAt: string;
};

export default function WhatsAppLogsPage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const loadLogs = async (showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    try {
      const d = await adminFetch<{ logs: Log[] }>("/api/bot/logs");
      setLogs(d.logs || []);
      setError("");
    } catch {
      setError("Could not load WhatsApp logs. Please verify your admin sign-in.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      l.phone.toLowerCase().includes(q) ||
      (l.body || "").toLowerCase().includes(q) ||
      (l.sentBy || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl">WhatsApp Activity Logs</h1>
          <p className="text-[13px] text-neutral-500 mt-0.5">
            Real-time feed of recent incoming and outgoing messages handled by WhatsApp.
          </p>
        </div>
        <button
          type="button"
          onClick={() => loadLogs(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors w-fit"
        >
          <FiRefreshCw className={refreshing ? "animate-spin" : ""} size={12} />
          {refreshing ? "Refreshing..." : "Refresh Logs"}
        </button>
      </div>

      <div className="relative">
        <FiSearch className="absolute left-3 top-3 text-neutral-400 text-xs" />
        <input
          type="text"
          placeholder="Filter by phone number or message text..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-8 pr-4 py-2 text-xs border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-black bg-white"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg flex justify-between items-center">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => loadLogs(true)}
            className="underline font-medium hover:text-red-900 ml-2"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="p-12 text-center text-xs text-neutral-500 flex items-center justify-center gap-2">
          <FiRefreshCw className="animate-spin" /> Loading recent activity logs...
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="p-12 text-center text-xs text-neutral-500 border border-neutral-200 rounded-lg bg-neutral-50/50 space-y-2">
          <FiMessageSquare size={28} className="mx-auto opacity-30 text-neutral-400" />
          <p>No activity logs found{search ? " matching your filter" : ""}.</p>
          <p className="text-[11px] text-neutral-400">
            Messages sent or received via bot, broadcasts, and inbox will appear here.
          </p>
        </div>
      ) : (
        <div className="border border-neutral-200 rounded-lg divide-y divide-neutral-100 bg-white overflow-hidden shadow-2xs">
          {filteredLogs.map((l) => {
            const isCustomer =
              l.direction === "incoming" ||
              l.direction === "inbound" ||
              l.sentBy === "customer";
            const isBot = l.sentBy === "bot";
            const isAdmin = l.sentBy === "admin" || (!isCustomer && !isBot);

            return (
              <div key={l.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-[13px] hover:bg-neutral-50/60 transition-colors">
                <span className="text-neutral-400 text-xs sm:w-36 shrink-0">
                  {l.createdAt ? new Date(l.createdAt).toLocaleString("en-IN") : "—"}
                </span>
                <span className="font-semibold text-neutral-900 sm:w-28 shrink-0">
                  {l.phone}
                </span>
                <div className="sm:w-24 shrink-0">
                  {isCustomer && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-purple-50 text-purple-700 border border-purple-200">
                      Customer
                    </span>
                  )}
                  {isBot && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                      Bot
                    </span>
                  )}
                  {isAdmin && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Admin
                    </span>
                  )}
                </div>
                <span className="flex-1 text-neutral-700 whitespace-pre-wrap break-words">
                  {l.body || "—"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
