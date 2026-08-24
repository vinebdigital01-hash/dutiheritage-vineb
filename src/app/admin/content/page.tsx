"use client";

import { useEffect, useState } from "react";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import {
  PageHeader,
  AdminButton,
  AdminInput,
  AdminTextarea,
  useToast,
} from "@/components/admin/ui";

type SiteContent = {
  announcementText?: string;
  headerNavLinks?: { label: string; slug: string }[];
  homepageSlugs?: string[];
  promoBanner?: { headline?: string; subtext?: string; buttonText?: string };
  footer?: {
    companyName?: string;
    phone?: string;
    email?: string;
    address?: string;
    copyright?: string;
  };
};

const POLICY_SLUGS = [
  { slug: "privacy-policy", title: "Privacy Policy" },
  { slug: "return-exchange", title: "Return & Exchange" },
  { slug: "shipping", title: "Shipping" },
  { slug: "terms-conditions", title: "Terms & Conditions" },
];

export default function AdminContentPage() {
  const { show, Toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<SiteContent>({});
  const [navText, setNavText] = useState("");
  const [slugsText, setSlugsText] = useState("");
  const [policySlug, setPolicySlug] = useState(POLICY_SLUGS[0]!.slug);
  const [policyTitle, setPolicyTitle] = useState(POLICY_SLUGS[0]!.title);
  const [policyBody, setPolicyBody] = useState("");
  const [savingPolicy, setSavingPolicy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const data = await adminFetch<{ content: SiteContent }>(
          "/api/site-content"
        );
        const c = data.content || {};
        setContent(c);
        setNavText(
          (c.headerNavLinks || [])
            .map((l) => `${l.label}|${l.slug}`)
            .join("\n")
        );
        setSlugsText((c.homepageSlugs || []).join("\n"));
      } catch (e) {
        show(e instanceof AdminApiError ? e.message : "Load failed", "error");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const meta = POLICY_SLUGS.find((p) => p.slug === policySlug);
    if (meta) setPolicyTitle(meta.title);
    (async () => {
      try {
        const data = await adminFetch<{
          page: { title: string; content: string };
        }>(`/api/pages/${policySlug}`);
        setPolicyTitle(data.page.title);
        setPolicyBody(data.page.content || "");
      } catch {
        setPolicyBody("");
      }
    })();
  }, [policySlug]);

  const saveContent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const headerNavLinks = navText
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          const [label, slug] = line.split("|").map((s) => s.trim());
          return { label: label || "", slug: slug || "" };
        })
        .filter((l) => l.label && l.slug);

      const homepageSlugs = slugsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean);

      await adminFetch("/api/site-content", {
        method: "PUT",
        body: JSON.stringify({
          ...content,
          headerNavLinks,
          homepageSlugs,
        }),
      });
      show("Site content saved");
    } catch (err) {
      show(err instanceof AdminApiError ? err.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const savePolicy = async () => {
    setSavingPolicy(true);
    try {
      await adminFetch(`/api/pages/${policySlug}`, {
        method: "PUT",
        body: JSON.stringify({ title: policyTitle, content: policyBody }),
      });
      show("Policy page saved");
    } catch (err) {
      show(err instanceof AdminApiError ? err.message : "Save failed", "error");
    } finally {
      setSavingPolicy(false);
    }
  };

  if (loading) {
    return (
      <p className="text-[13px] text-neutral-500 animate-pulse">Loading…</p>
    );
  }

  return (
    <div>
      {Toast}
      <PageHeader
        title="Site content"
        subtitle="Announcement, navigation, promo, footer, and policy pages"
      />

      <form
        onSubmit={saveContent}
        className="bg-white border border-[var(--color-border)] rounded-xl p-5 md:p-8 shadow-sm space-y-6 mb-10"
      >
        <AdminInput
          label="Announcement bar"
          value={content.announcementText || ""}
          onChange={(e) =>
            setContent((c) => ({ ...c, announcementText: e.target.value }))
          }
        />

        <AdminTextarea
          label="Header nav (one per line: Label|/collections/slug)"
          value={navText}
          onChange={(e) => setNavText(e.target.value)}
          placeholder={"New Arrivals|/collections/new-arrivals"}
        />

        <AdminTextarea
          label="Homepage collection slugs (one per line, top to bottom)"
          value={slugsText}
          onChange={(e) => setSlugsText(e.target.value)}
        />

        <div className="grid md:grid-cols-3 gap-4">
          <AdminInput
            label="Promo headline"
            value={content.promoBanner?.headline || ""}
            onChange={(e) =>
              setContent((c) => ({
                ...c,
                promoBanner: { ...c.promoBanner, headline: e.target.value },
              }))
            }
          />
          <AdminInput
            label="Promo subtext"
            value={content.promoBanner?.subtext || ""}
            onChange={(e) =>
              setContent((c) => ({
                ...c,
                promoBanner: { ...c.promoBanner, subtext: e.target.value },
              }))
            }
          />
          <AdminInput
            label="Promo button"
            value={content.promoBanner?.buttonText || ""}
            onChange={(e) =>
              setContent((c) => ({
                ...c,
                promoBanner: { ...c.promoBanner, buttonText: e.target.value },
              }))
            }
          />
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <AdminInput
            label="Footer company"
            value={content.footer?.companyName || ""}
            onChange={(e) =>
              setContent((c) => ({
                ...c,
                footer: { ...c.footer, companyName: e.target.value },
              }))
            }
          />
          <AdminInput
            label="Footer phone"
            value={content.footer?.phone || ""}
            onChange={(e) =>
              setContent((c) => ({
                ...c,
                footer: { ...c.footer, phone: e.target.value },
              }))
            }
          />
          <AdminInput
            label="Footer email"
            value={content.footer?.email || ""}
            onChange={(e) =>
              setContent((c) => ({
                ...c,
                footer: { ...c.footer, email: e.target.value },
              }))
            }
          />
          <AdminInput
            label="Footer copyright"
            value={content.footer?.copyright || ""}
            onChange={(e) =>
              setContent((c) => ({
                ...c,
                footer: { ...c.footer, copyright: e.target.value },
              }))
            }
          />
        </div>
        <AdminTextarea
          label="Footer address"
          value={content.footer?.address || ""}
          onChange={(e) =>
            setContent((c) => ({
              ...c,
              footer: { ...c.footer, address: e.target.value },
            }))
          }
        />

        <AdminButton type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save site content"}
        </AdminButton>
      </form>

      <div className="bg-white border border-[var(--color-border)] rounded-xl p-5 md:p-8 shadow-sm space-y-4">
        <h2 className="text-[13px] tracking-[2px] uppercase font-medium">
          Policy pages
        </h2>
        <div className="flex flex-wrap gap-2">
          {POLICY_SLUGS.map((p) => (
            <button
              key={p.slug}
              type="button"
              onClick={() => setPolicySlug(p.slug)}
              className={`px-3 py-1.5 text-[12px] rounded-lg border ${
                policySlug === p.slug
                  ? "bg-black text-white border-black"
                  : "bg-white border-[var(--color-border)]"
              }`}
            >
              {p.title}
            </button>
          ))}
        </div>
        <AdminInput
          label="Title"
          value={policyTitle}
          onChange={(e) => setPolicyTitle(e.target.value)}
        />
        <AdminTextarea
          label="Content (HTML or plain text)"
          value={policyBody}
          onChange={(e) => setPolicyBody(e.target.value)}
          className="min-h-[200px]"
        />
        <AdminButton onClick={savePolicy} disabled={savingPolicy}>
          {savingPolicy ? "Saving…" : "Save policy page"}
        </AdminButton>
      </div>
    </div>
  );
}
