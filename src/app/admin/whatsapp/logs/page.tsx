"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";

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
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch<{ logs: Log[] }>("/api/bot/logs")
      .then((d) => setLogs(d.logs || []))
      .catch(() => setError("Could not load logs. Sign in again if you were logged out."));
  }, []);

  return (
    <div>
      <h1 className="font-serif text-2xl mb-2">WhatsApp logs</h1>
      <p className="text-[13px] text-neutral-500 mb-8">
        Last 100 saved messages. This uses your admin sign-in, not a public URL.
      </p>
      {error && <p className="text-[13px] text-[#8B3A2A] mb-4">{error}</p>}
      {logs.length === 0 && !error ? (
        <p className="text-[13px] text-neutral-500">No messages saved yet.</p>
      ) : (
        <div className="border border-neutral-200 divide-y divide-neutral-100">
          {logs.map((l) => (
            <div key={l.id} className="p-4 flex gap-4 text-[13px]">
              <span className="text-neutral-400 w-40 shrink-0">
                {l.createdAt ? new Date(l.createdAt).toLocaleString("en-IN") : "—"}
              </span>
              <span className="font-medium w-28 shrink-0">{l.phone}</span>
              <span className="text-neutral-500 w-20 shrink-0">
                {l.sentBy || l.direction || "—"}
              </span>
              <span className="flex-1">{l.body || "—"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
