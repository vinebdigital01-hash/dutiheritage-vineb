"use client";

import { useEffect, useState } from "react";
import { FiCpu, FiUser, FiActivity } from "react-icons/fi";

type LogEntry = {
  id: string;
  phone: string;
  direction: "inbound" | "outbound" | "admin";
  sentBy: "user" | "bot" | "admin";
  body: string;
  createdAt: string;
};

export default function WhatsAppLogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, you might have a dedicated endpoint for logs.
    // For this example, we'll fetch sessions and their messages, or just mock it if an endpoint isn't ready.
    // Let's assume we can fetch all messages with a logs=true query parameter, or we mock it.
    const fetchLogs = async () => {
      try {
        const res = await fetch("/api/bot/chat?logs=true");
        if (res.ok) {
          const data = await res.json();
          // Assuming the API returns a 'logs' array if logs=true
          if (data.logs) {
            setLogs(data.logs);
          }
        }
      } catch (error) {
        console.error("Error fetching logs:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, []);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-serif tracking-[1px] uppercase mb-2">Bot Activity Logs</h1>
        <p className="text-sm text-neutral-500">View recent interactions handled by the automated bot.</p>
      </div>

      <div className="bg-white border border-[var(--color-border)] rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-sm text-neutral-500">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center">
            <FiActivity size={48} className="text-neutral-300 mb-4" />
            <p className="text-neutral-500">No activity logs found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f8f9fa] border-b border-[var(--color-border)] text-xs uppercase tracking-[1px] text-neutral-500">
                <tr>
                  <th className="px-6 py-4 font-medium">Timestamp</th>
                  <th className="px-6 py-4 font-medium">Phone / User</th>
                  <th className="px-6 py-4 font-medium">Actor</th>
                  <th className="px-6 py-4 font-medium">Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--color-border)]">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-neutral-50">
                    <td className="px-6 py-4 whitespace-nowrap text-neutral-500">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium">
                      {log.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {log.sentBy === "bot" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium">
                          <FiCpu size={12} /> Bot
                        </span>
                      ) : log.sentBy === "admin" ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-medium">
                          <FiUser size={12} /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium">
                          <FiUser size={12} /> User
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-neutral-700 max-w-md truncate">
                      {log.body}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
