"use client";

import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-api";

export default function WhatsAppAnalyticsPage() {
  const [stats, setStats] = useState({
    totalConversations: 0,
    activeBots: 0,
    messagesSent: 0,
    messagesReceived: 0,
  });
  const [error, setError] = useState("");

  useEffect(() => {
    adminFetch<typeof stats>("/api/bot/analytics")
      .then(setStats)
      .catch(() => setError("Could not load counts. Sign in again if you were logged out."));
  }, []);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-2xl">WhatsApp counts</h1>
        <p className="text-[13px] text-neutral-500 mt-1">
          Live numbers from saved chats. We do not invent weekly charts or “top queries”.
        </p>
      </div>

      {error && (
        <p className="text-[13px] text-[#8B3A2A]">{error}</p>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Conversations", value: stats.totalConversations },
          { label: "Bots on", value: stats.activeBots },
          { label: "Messages sent", value: stats.messagesSent },
          { label: "Messages received", value: stats.messagesReceived },
        ].map((s) => (
          <div key={s.label} className="border border-neutral-200 p-6">
            <p className="text-[10px] tracking-[2px] uppercase text-neutral-400 mb-2">
              {s.label}
            </p>
            <p className="font-serif text-3xl">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
