"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import {
  PageHeader,
  AdminButton,
  AdminInput,
  AdminSelect,
  Badge,
  EmptyState,
  useToast,
} from "@/components/admin/ui";

type Group = {
  id: string;
  name: string;
  description?: string;
  type: "smart" | "manual";
  memberCount: number;
  filters?: Array<{ field: string; operator: string; value?: unknown }>;
};

type Campaign = {
  id: string;
  name: string;
  channel: string;
  groupName?: string;
  status: string;
  sentAt?: string;
  stats?: { sent?: number; failed?: number };
};

const SMART_PRESETS = [
  {
    label: "High spenders (₹10k+)",
    filters: [{ field: "minTotalSpent", operator: "gte", value: 10000 }],
  },
  {
    label: "Window shoppers (0 orders)",
    filters: [{ field: "neverPurchased", operator: "eq", value: true }],
  },
  {
    label: "Dormant 30+ days",
    filters: [{ field: "dormantDays", operator: "gte", value: 30 }],
  },
  {
    label: "Cart abandoners (7d)",
    filters: [{ field: "cartAbandoner", operator: "eq", value: 7 }],
  },
];

export default function AdminGroupsPage() {
  const { show, Toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({
    name: "",
    type: "smart" as "smart" | "manual",
    preset: "0",
  });
  const [campaignForm, setCampaignForm] = useState({
    groupId: "",
    subject: "",
    body: "",
    channel: "email" as "email" | "whatsapp",
  });

  const load = async () => {
    setLoading(true);
    try {
      const [g, c] = await Promise.all([
        adminFetch<{ groups: Group[] }>("/api/groups"),
        adminFetch<{ campaigns: Campaign[] }>("/api/campaigns?limit=20"),
      ]);
      setGroups(g.groups || []);
      setCampaigns(c.campaigns || []);
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

  const createGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    if (!window.confirm("Are you sure you want to create this group?")) return;
    setCreating(true);
    try {
      const preset = SMART_PRESETS[Number(form.preset)];
      await adminFetch("/api/groups", {
        method: "POST",
        body: JSON.stringify({
          name: form.name.trim(),
          type: form.type,
          filters:
            form.type === "smart" ? preset?.filters || [] : undefined,
        }),
      });
      setForm({ name: "", type: "smart", preset: "0" });
      show("Group created");
      await load();
    } catch (err) {
      show(err instanceof AdminApiError ? err.message : "Create failed", "error");
    } finally {
      setCreating(false);
    }
  };

  const sendCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignForm.groupId) return;
    if (!window.confirm("Are you sure you want to send this campaign? This action cannot be undone.")) return;
    setSending(true);
    try {
      const data = await adminFetch<{ sent: number; failed: number }>(
        "/api/campaigns",
        {
          method: "POST",
          body: JSON.stringify({
            groupId: campaignForm.groupId,
            channel: campaignForm.channel,
            subject: campaignForm.subject,
            body: campaignForm.body,
            name: `${campaignForm.channel} — ${groups.find((g) => g.id === campaignForm.groupId)?.name}`,
          }),
        }
      );
      show(`Sent ${data.sent} messages (${data.failed} failed)`);
      setCampaignForm({ groupId: "", subject: "", body: "", channel: "email" });
      await load();
    } catch (err) {
      show(err instanceof AdminApiError ? err.message : "Send failed", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      {Toast}
      <PageHeader
        title="Groups & campaigns"
        subtitle="Segment customers and send bulk email or WhatsApp"
      />

      <form
        onSubmit={createGroup}
        className="bg-white border border-[var(--color-border)] rounded-xl p-5 mb-8 shadow-sm grid md:grid-cols-2 lg:grid-cols-4 gap-4 items-end"
      >
        <AdminInput
          label="Group name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          required
        />
        <AdminSelect
          label="Type"
          value={form.type}
          onChange={(e) =>
            setForm({ ...form, type: e.target.value as "smart" | "manual" })
          }
        >
          <option value="smart">Smart (auto)</option>
          <option value="manual">Manual</option>
        </AdminSelect>
        {form.type === "smart" && (
          <AdminSelect
            label="Preset rule"
            value={form.preset}
            onChange={(e) => setForm({ ...form, preset: e.target.value })}
          >
            {SMART_PRESETS.map((p, i) => (
              <option key={p.label} value={String(i)}>
                {p.label}
              </option>
            ))}
          </AdminSelect>
        )}
        <AdminButton type="submit" disabled={creating}>
          {creating ? "Creating…" : "Create group"}
        </AdminButton>
      </form>

      {loading ? (
        <p className="text-[13px] animate-pulse text-neutral-500">Loading…</p>
      ) : groups.length === 0 ? (
        <EmptyState title="No groups" description="Create a smart or manual group above." />
      ) : (
        <ul className="grid md:grid-cols-2 gap-4 mb-12">
          {groups.map((g) => (
            <li
              key={g.id}
              className="bg-white border border-[var(--color-border)] rounded-xl p-5 shadow-sm"
            >
              <div className="flex justify-between items-start gap-2 mb-2">
                <div>
                  <p className="font-medium">{g.name}</p>
                  <p className="text-[12px] text-neutral-500 capitalize">
                    {g.type} · {g.memberCount} members
                  </p>
                </div>
                <Badge tone={g.type === "smart" ? "info" : "neutral"}>
                  {g.type}
                </Badge>
              </div>
              <div className="flex justify-between items-center mt-3">
                <Link
                  href={`/admin/groups/${g.id}`}
                  className="text-[12px] uppercase tracking-wider underline"
                >
                  View members
                </Link>
                <button
                  type="button"
                  onClick={async () => {
                    if (!confirm("Delete this group permanently?")) return;
                    try {
                      await adminFetch(`/api/groups/${g.id}`, { method: 'DELETE' });
                      show("Group deleted");
                      setGroups(prev => prev.filter(x => x.id !== g.id));
                    } catch (e: any) {
                      show(e.message || "Failed to delete group", "error");
                    }
                  }}
                  className="text-[12px] uppercase tracking-wider text-red-600 hover:underline"
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <h2 className="text-[13px] tracking-[2px] uppercase mb-4">Send campaign</h2>
      <form
        onSubmit={sendCampaign}
        className="bg-white border border-[var(--color-border)] rounded-xl p-5 mb-12 shadow-sm space-y-4"
      >
        <div className="grid md:grid-cols-2 gap-4">
          <AdminSelect
            label="Group"
            value={campaignForm.groupId}
            onChange={(e) =>
              setCampaignForm({ ...campaignForm, groupId: e.target.value })
            }
            required
          >
            <option value="">Select group…</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} ({g.memberCount})
              </option>
            ))}
          </AdminSelect>
          <AdminSelect
            label="Channel"
            value={campaignForm.channel}
            onChange={(e) =>
              setCampaignForm({
                ...campaignForm,
                channel: e.target.value as "email" | "whatsapp",
              })
            }
          >
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
          </AdminSelect>
        </div>
        {campaignForm.channel === "email" && (
          <AdminInput
            label="Subject"
            value={campaignForm.subject}
            onChange={(e) =>
              setCampaignForm({ ...campaignForm, subject: e.target.value })
            }
          />
        )}
        <label className="flex flex-col gap-1.5 text-[12px] tracking-[1px] uppercase text-neutral-500">
          Message (HTML ok for email)
          <textarea
            value={campaignForm.body}
            onChange={(e) =>
              setCampaignForm({ ...campaignForm, body: e.target.value })
            }
            className="border border-[var(--color-border)] rounded-lg px-3 py-2.5 text-[14px] tracking-normal normal-case min-h-[120px] outline-none focus:border-black"
            required
          />
        </label>
        <AdminButton type="submit" disabled={sending}>
          {sending ? "Sending…" : "Send to group"}
        </AdminButton>
      </form>

      <h2 className="text-[13px] tracking-[2px] uppercase mb-4">Campaign history</h2>
      {campaigns.length === 0 ? (
        <EmptyState title="No campaigns sent yet" />
      ) : (
        <ul className="bg-white border border-[var(--color-border)] rounded-xl divide-y text-[13px]">
          {campaigns.map((c) => (
            <li key={c.id} className="px-5 py-3 flex justify-between gap-4">
              <div>
                <p className="font-medium">{c.name}</p>
                <p className="text-neutral-500 text-[12px]">
                  {c.channel} · {c.groupName} · {c.stats?.sent ?? 0} sent
                </p>
              </div>
              <Badge tone={c.status === "sent" ? "success" : "danger"}>
                {c.status}
              </Badge>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
