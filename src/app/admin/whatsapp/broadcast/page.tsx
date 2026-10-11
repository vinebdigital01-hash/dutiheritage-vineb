"use client";

import { useState, useEffect } from "react";
import { AdminButton, AdminInput, AdminSelect, AdminTextarea, useToast } from "@/components/admin/ui";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import Link from "next/link";

export default function BroadcastPage() {
  const { show, Toast } = useToast();
  const [audience, setAudience] = useState("all");
  const [phones, setPhones] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("text");
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [reason, setReason] = useState("");

  const checkStatus = () => {
    setConfigured(null);
    adminFetch<{ configured: boolean; reason?: string }>("/api/bot/broadcast")
      .then((d) => {
        setConfigured(d.configured);
        setReason(d.reason || "");
      })
      .catch(() => {
        setConfigured(false);
        setReason("Could not check WhatsApp connection. Sign in again if you were logged out.");
      });
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const send = async () => {
    if (!configured) {
      show("WhatsApp is not connected. Nothing was sent.", "error");
      return;
    }
    if (!message.trim()) {
      show("Write a message first.", "error");
      return;
    }
    if (audience === "custom" && !phones.trim()) {
      show("Add phone numbers, one per line or comma-separated.", "error");
      return;
    }
    setLoading(true);
    try {
      const data = await adminFetch<{ message?: string; sent?: number; failed?: number }>(
        "/api/bot/broadcast",
        {
          method: "POST",
          body: JSON.stringify({
            audience,
            phones: audience === "custom" ? phones : undefined,
            message: message.trim(),
            type,
          }),
        }
      );
      show(data.message || `Sent ${data.sent || 0}`);
      setMessage("");
    } catch (e) {
      show(e instanceof AdminApiError ? e.message : "Broadcast failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-4">
      {Toast}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="font-serif text-2xl">Broadcast WhatsApp</h1>
          <p className="text-[13px] text-neutral-600 mt-1">
            Send real-time WhatsApp updates or announcements to customers.
          </p>
        </div>
        <button
          type="button"
          onClick={checkStatus}
          className="text-xs text-neutral-500 hover:text-black underline pt-1"
        >
          Check status
        </button>
      </div>

      {configured === false && (
        <div className="text-[13px] text-[#8B3A2A] bg-[#8B3A2A]/5 border border-[#8B3A2A]/20 p-3 rounded-lg flex justify-between items-center">
          <span>{reason || "WhatsApp is not connected. No messages will be sent."}</span>
          <button
            type="button"
            onClick={checkStatus}
            className="text-xs font-semibold underline shrink-0 ml-3"
          >
            Retry
          </button>
        </div>
      )}
      {configured === true && (
        <p className="text-[13px] text-emerald-800 bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center justify-between">
          <span>WhatsApp Bot is active and ready to deliver broadcasts. (Up to 200 numbers per send)</span>
          <Link href="/admin/whatsapp/logs" className="text-xs underline font-medium ml-2 shrink-0">
            View Logs
          </Link>
        </p>
      )}
      <AdminSelect
        label="Who"
        value={audience}
        onChange={(e) => setAudience(e.target.value)}
      >
        <option value="all">Customers with a phone (up to 200)</option>
        <option value="active">Chatted in the last 24 hours</option>
        <option value="custom">These numbers only</option>
      </AdminSelect>
      {audience === "custom" && (
        <AdminTextarea
          label="Phone numbers"
          value={phones}
          onChange={(e) => setPhones(e.target.value)}
          placeholder="9876543210, 9123456789"
          rows={4}
        />
      )}
      <AdminSelect
        label="Kind"
        value={type}
        onChange={(e) => setType(e.target.value)}
      >
        <option value="text">Plain text</option>
        <option value="template">Approved template name</option>
      </AdminSelect>
      <AdminInput
        label={type === "template" ? "Template name" : "Message"}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={type === "template" ? "order_shipped" : "Hi from Duti Heritage"}
      />
      <AdminButton onClick={send} disabled={loading || configured !== true}>
        {loading ? "Sending…" : configured === false ? "WhatsApp not connected" : "Send WhatsApp"}
      </AdminButton>
    </div>
  );
}
