"use client";

import { useEffect, useState } from "react";
import { FiMessageSquare, FiUsers, FiCpu, FiClock } from "react-icons/fi";

export default function WhatsAppAnalyticsPage() {
  const [stats, setStats] = useState({
    totalConversations: 0,
    messagesSent: 0,
    messagesReceived: 0,
    activeBots: 0,
  });

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await fetch("/api/bot/analytics");
        if (res.ok) {
          const data = await res.json();
          setStats({
            totalConversations: data.totalConversations || 0,
            messagesSent: data.messagesSent || 0,
            messagesReceived: data.messagesReceived || 0,
            activeBots: data.activeBots || 0,
          });
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      }
    };

    fetchAnalytics();
  }, []);

  const cards = [
    { title: "Total Conversations", value: stats.totalConversations, icon: FiUsers, color: "text-blue-500", bg: "bg-blue-50" },
    { title: "Messages Sent", value: stats.messagesSent, icon: FiMessageSquare, color: "text-green-500", bg: "bg-green-50" },
    { title: "Messages Received", value: stats.messagesReceived, icon: FiMessageSquare, color: "text-purple-500", bg: "bg-purple-50" },
    { title: "Conversations in Bot Mode", value: stats.activeBots, icon: FiCpu, color: "text-orange-500", bg: "bg-orange-50" },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-serif tracking-[1px] uppercase mb-2">WhatsApp Analytics</h1>
        <p className="text-sm text-neutral-500">Overview of your WhatsApp bot performance and metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="bg-white p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-lg ${card.bg}`}>
                  <Icon className={`text-xl ${card.color}`} />
                </div>
              </div>
              <div>
                <p className="text-sm text-neutral-500 font-medium mb-1">{card.title}</p>
                <h3 className="text-3xl font-serif">{card.value.toLocaleString()}</h3>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
          <h3 className="font-medium mb-4 flex items-center gap-2">
            <FiClock /> Activity over Time (Mock)
          </h3>
          <div className="h-64 flex items-end gap-2 justify-between">
            {/* Mock chart bars */}
            {[40, 70, 45, 90, 65, 85, 120].map((height, idx) => (
              <div key={idx} className="w-full bg-neutral-100 rounded-t-sm relative group">
                <div 
                  className="absolute bottom-0 w-full bg-black rounded-t-sm transition-all duration-500" 
                  style={{ height: `${height}%` }}
                ></div>
              </div>
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-neutral-400">
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
            <span>Sun</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
          <h3 className="font-medium mb-4">Top Queries (Mock)</h3>
          <div className="space-y-4">
            {[
              { query: "Order Status", percent: 45 },
              { query: "Return Policy", percent: 25 },
              { query: "Shipping Cost", percent: 15 },
              { query: "Product Sizing", percent: 10 },
              { query: "Other", percent: 5 },
            ].map((item, idx) => (
              <div key={idx}>
                <div className="flex justify-between text-sm mb-1">
                  <span>{item.query}</span>
                  <span className="font-medium">{item.percent}%</span>
                </div>
                <div className="w-full bg-neutral-100 rounded-full h-2">
                  <div className="bg-black h-2 rounded-full" style={{ width: `${item.percent}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
