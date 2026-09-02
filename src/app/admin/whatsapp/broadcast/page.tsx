"use client";

import { useState } from "react";
import { FiSend, FiUsers, FiMessageSquare } from "react-icons/fi";

export default function WhatsAppBroadcastPage() {
  const [audience, setAudience] = useState("all");
  const [phones, setPhones] = useState("");
  const [messageType, setMessageType] = useState("text");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ success?: boolean; message?: string } | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message) return;

    setSending(true);
    setResult(null);

    try {
      const res = await fetch("/api/bot/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phones: audience === "custom" ? phones : "all",
          type: messageType,
          message,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setResult({ success: true, message: data.message });
        setMessage("");
      } else {
        setResult({ success: false, message: data.error || "Failed to send broadcast." });
      }
    } catch (error: any) {
      setResult({ success: false, message: error.message || "An error occurred." });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-serif tracking-[1px] uppercase mb-2">Broadcast Message</h1>
        <p className="text-sm text-neutral-500">Send a bulk message to your customers via WhatsApp.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-[var(--color-border)] shadow-sm">
        <form onSubmit={handleSend} className="space-y-6">
          
          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <FiUsers /> Audience
            </label>
            <select
              value={audience}
              onChange={(e) => setAudience(e.target.value)}
              className="w-full border border-neutral-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none"
            >
              <option value="all">All Customers</option>
              <option value="active">Active Conversations (Last 24h)</option>
              <option value="custom">Specific Phone Numbers</option>
            </select>
          </div>

          {audience === "custom" && (
            <div>
              <label className="block text-sm font-medium mb-2">Phone Numbers</label>
              <textarea
                value={phones}
                onChange={(e) => setPhones(e.target.value)}
                placeholder="Enter comma-separated phone numbers with country code (e.g. 919876543210, 919876543211)"
                rows={3}
                className="w-full border border-neutral-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none"
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2">Message Type</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="messageType"
                  value="text"
                  checked={messageType === "text"}
                  onChange={(e) => setMessageType(e.target.value)}
                  className="accent-black"
                />
                Regular Text
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  name="messageType"
                  value="template"
                  checked={messageType === "template"}
                  onChange={(e) => setMessageType(e.target.value)}
                  className="accent-black"
                />
                Approved Template
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2 flex items-center gap-2">
              <FiMessageSquare /> Message Body
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={messageType === "template" ? "Enter template name or ID..." : "Type your message here..."}
              rows={5}
              className="w-full border border-neutral-300 rounded-md p-2.5 text-sm focus:ring-1 focus:ring-black focus:border-black outline-none"
              required
            />
          </div>

          {result && (
            <div className={`p-3 rounded-md text-sm ${result.success ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {result.message}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t border-[var(--color-border)]">
            <button
              type="submit"
              disabled={sending || !message}
              className="bg-black text-white px-6 py-2.5 rounded-md text-sm tracking-[1px] uppercase flex items-center gap-2 hover:bg-black/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {sending ? "Sending..." : <><FiSend /> Send Broadcast</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
