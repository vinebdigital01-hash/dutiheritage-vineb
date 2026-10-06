"use client";

import { useState, useEffect } from "react";
import { AdminButton, AdminInput, AdminSelect, AdminTextarea } from "@/components/admin/ui";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import { useToast } from "@/components/admin/Toast";
import Link from "next/link";

export default function BroadcastPage() {
  const { show } = useToast();
  const [audience, setAudience] = useState("all");
  const [phones, setPhones] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("text");
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [reason, setReason] = useState("");

  useEffect(() => {
    adminFetch<{ configured: boolean; reason?: string }>("/api/bot/broadcast")
      .then((d) => {
        setConfigured(d.configured);
        setReason(d.reason || "");
      })
      .catch(() => {
        setConfigured(false);
        setReason("Could not check WhatsApp. Sign in again if you were logged out.");
      });
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
      <h1 className="font-serif text-2xl">Send to many</h1>
      <p className="text-[13px] text-neutral-600">
        This sends real WhatsApp. If keys are missing, the button stays off — we will not show a fake success.         For a saved group, use{" "}
        <Link href="/admin/groups" className="underline">
          Groups
        </Link>
        .
      </p>
      {configured === false && (
        <p className="text-[13px] text-[#8B3A2A] bg-[#8B3A2A]/5 border border-[#8B3A2A]/20 p-3">
          {reason || "WhatsApp is not connected. No messages will be sent."}
        </p>
      )}
      {configured === true && (
        <p className="text-[13px] text-neutral-600 bg-neutral-50 border border-neutral-200 p-3">
          WhatsApp is connected. Up to 200 numbers per send.
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
