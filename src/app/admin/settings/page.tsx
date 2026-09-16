"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import {
  PageHeader,
  AdminButton,
  AdminInput,
  AdminTextarea,
  AdminSelect,
  useToast,
} from "@/components/admin/ui";
import { CodSettingsForm } from "@/components/admin/CodSettingsForm";
import type { StoreSettingsDTO } from "@/lib/store-settings";

const TABS = [
  { id: "identity", label: "Store & GSTIN" },
  { id: "payments", label: "Payments" },
  { id: "tax", label: "Tax defaults" },
  { id: "cod", label: "Where COD is allowed" },
  { id: "seo", label: "SEO" },
  { id: "flags", label: "Flags" },
  { id: "messages", label: "Test send" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function AdminSettingsPage() {
  return (
    <Suspense fallback={<p className="text-[13px] text-neutral-500">Loading settings…</p>}>
      <SettingsHub />
    </Suspense>
  );
}

function SettingsHub() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const tabParam = searchParams.get("tab") as TabId | null;
  const tab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : "identity";
  const { show, Toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<StoreSettingsDTO | null>(null);

  const setTab = (id: TabId) => {
    router.replace(`/admin/settings?tab=${id}`);
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminFetch<{ settings: StoreSettingsDTO }>("/api/settings/store");
      setForm(data.settings);
    } catch (e) {
      show(e instanceof AdminApiError ? e.message : "Failed to load settings", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const saveStore = async (partial?: Partial<StoreSettingsDTO>) => {
    if (!form) return;
    setSaving(true);
    try {
      const payload = { ...form, ...partial };
      const data = await adminFetch<{ settings: StoreSettingsDTO }>("/api/settings/store", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setForm(data.settings);
      show("Settings saved");
    } catch (e) {
      show(e instanceof AdminApiError ? e.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      {Toast}
      <PageHeader
        title="Store settings"
        subtitle="GSTIN, online pay, COD pincodes, and a test email or WhatsApp"
      />

      <div className="flex gap-2 flex-wrap mb-8 border-b border-[var(--color-border)] pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-3 py-2 text-[12px] uppercase tracking-wider rounded-lg ${
              tab === t.id ? "bg-black text-white" : "bg-white border hover:bg-neutral-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading || !form ? (
        <p className="text-[13px] text-neutral-500 animate-pulse">Loading settings…</p>
      ) : (
        <>
          {tab === "identity" && (
            <section className="bg-white border rounded-xl p-6 max-w-3xl space-y-4">
              <p className="text-[13px] text-neutral-500">
                Used on GST tax invoices. Env values are the fallback if a field is empty.
              </p>
              <AdminInput
                label="Legal name"
                value={form.legalName}
                onChange={(e) => setForm({ ...form, legalName: e.target.value })}
              />
              <AdminInput
                label="GSTIN"
                value={form.gstin}
                onChange={(e) => setForm({ ...form, gstin: e.target.value })}
              />
              <AdminTextarea
                label="Address"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
              />
              <div className="grid md:grid-cols-2 gap-4">
                <AdminInput
                  label="State"
                  value={form.state}
                  onChange={(e) => setForm({ ...form, state: e.target.value })}
                />
                <AdminInput
                  label="State code"
                  value={form.stateCode}
                  onChange={(e) => setForm({ ...form, stateCode: e.target.value })}
                  placeholder="06"
                />
                <AdminInput
                  label="Support email"
                  value={form.supportEmail}
                  onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
                />
                <AdminInput
                  label="Support phone"
                  value={form.supportPhone}
                  onChange={(e) => setForm({ ...form, supportPhone: e.target.value })}
                />
              </div>
              <AdminButton onClick={() => saveStore()} disabled={saving}>
                {saving ? "Saving…" : "Save identity"}
              </AdminButton>
            </section>
          )}

          {tab === "payments" && (
            <section className="bg-white border rounded-xl p-6 max-w-3xl space-y-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.prepaidEnabled}
                  onChange={(e) => setForm({ ...form, prepaidEnabled: e.target.checked })}
                  className="accent-black w-4 h-4"
                />
                Enable online / prepaid checkout (Razorpay)
              </label>
              <p className="text-[13px] text-neutral-500">
                COD on/off and pincode lists live under the COD & shipping tab. Razorpay keys stay in
                env — this only hides prepaid at checkout.
              </p>
              <AdminButton onClick={() => saveStore()} disabled={saving}>
                {saving ? "Saving…" : "Save payments"}
              </AdminButton>
            </section>
          )}

          {tab === "tax" && (
            <section className="bg-white border rounded-xl p-6 max-w-3xl space-y-4">
              <p className="text-[13px] text-neutral-500">
                New products pick these up. Listed prices are GST-inclusive.
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <AdminInput
                  label="Default HSN"
                  value={form.defaultHsn}
                  onChange={(e) => setForm({ ...form, defaultHsn: e.target.value })}
                />
                <AdminSelect
                  label="Default GST rate"
                  value={String(form.defaultGstRate)}
                  onChange={(e) => setForm({ ...form, defaultGstRate: Number(e.target.value) })}
                >
                  <option value="0">0%</option>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </AdminSelect>
              </div>
              <AdminButton onClick={() => saveStore()} disabled={saving}>
                {saving ? "Saving…" : "Save tax defaults"}
              </AdminButton>
            </section>
          )}

          {tab === "cod" && (
            <section className="max-w-3xl space-y-3">
              <h2 className="text-[14px] font-medium">Where cash on delivery is allowed</h2>
              <p className="text-[13px] text-neutral-600">
                Add or remove pincodes. A blocked customer still cannot use COD even if the pincode is allowed.
              </p>
              <CodSettingsForm embedded />
            </section>
          )}

          {tab === "seo" && (
            <section className="bg-white border rounded-xl p-6 max-w-3xl space-y-4">
              <AdminInput
                label="Default site title"
                value={form.seoTitle}
                onChange={(e) => setForm({ ...form, seoTitle: e.target.value })}
                placeholder="Duti Heritage | Premium Fashion"
              />
              <AdminTextarea
                label="Default meta description"
                value={form.seoDescription}
                onChange={(e) => setForm({ ...form, seoDescription: e.target.value })}
              />
              <AdminButton onClick={() => saveStore()} disabled={saving}>
                {saving ? "Saving…" : "Save SEO"}
              </AdminButton>
            </section>
          )}

          {tab === "flags" && (
            <section className="bg-white border rounded-xl p-6 max-w-3xl space-y-4">
              {(["reviews", "wishlist", "whatsappWidget"] as const).map((key) => (
                <label key={key} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.flags[key]}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        flags: { ...form.flags, [key]: e.target.checked },
                      })
                    }
                    className="accent-black w-4 h-4"
                  />
                  {key === "reviews"
                    ? "Reviews"
                    : key === "wishlist"
                      ? "Wishlist"
                      : "WhatsApp widget"}
                </label>
              ))}
              <p className="text-[13px] text-neutral-500">
                Flags are stored here for ops. Product/review surfaces still exist; turn these off
                as a reminder before a full hide in a later phase.
              </p>
              <AdminButton onClick={() => saveStore()} disabled={saving}>
                {saving ? "Saving…" : "Save flags"}
              </AdminButton>
            </section>
          )}

          {tab === "messages" && <TestSendPanel />}
        </>
      )}
    </div>
  );
}

function TestSendPanel() {
  const { show, Toast } = useToast();
  const [channel, setChannel] = useState<"email" | "whatsapp">("email");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);

  const send = async () => {
    setBusy(true);
    try {
      const res = await adminFetch<{
        result: { ok: boolean; skipped?: boolean; error?: string };
        configured: boolean;
      }>("/api/settings/test-send", {
        method: "POST",
        body: JSON.stringify({ channel, to }),
      });
      if (!res.configured) {
        show(`${channel} is not configured in env`, "error");
      } else if (res.result.skipped) {
        show("Send skipped — provider not fully configured", "error");
      } else if (!res.result.ok) {
        show(res.result.error || "Send failed", "error");
      } else {
        show("Test sent");
      }
    } catch (e) {
      show(e instanceof AdminApiError ? e.message : "Send failed", "error");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="bg-white border rounded-xl p-6 max-w-3xl space-y-4">
      {Toast}
      <p className="text-[13px] text-neutral-500">
        Sends a one-off test so you can confirm Resend / WhatsApp without waiting for a real order.
      </p>
      <AdminSelect
        label="Channel"
        value={channel}
        onChange={(e) => setChannel(e.target.value as "email" | "whatsapp")}
      >
        <option value="email">Email</option>
        <option value="whatsapp">WhatsApp</option>
      </AdminSelect>
      <AdminInput
        label={channel === "email" ? "Email to" : "Phone (with country code)"}
        value={to}
        onChange={(e) => setTo(e.target.value)}
      />
      <AdminButton onClick={send} disabled={busy || !to.trim()}>
        {busy ? "Sending…" : "Send test"}
      </AdminButton>
    </section>
  );
}
