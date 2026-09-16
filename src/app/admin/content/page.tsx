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
import { ImageUploader } from "@/components/admin/ImageUploader";
import type { HeroBanner } from "@/lib/site-content-shared";

type SiteContent = {
  announcementText?: string;
  headerNavLinks?: { label: string; slug: string }[];
  homepageSlugs?: string[];
  heroBanners?: HeroBanner[];
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
    if (!window.confirm("Are you sure you want to update the site content?")) return;
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
          heroBanners: content.heroBanners || [],
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
    if (!window.confirm("Are you sure you want to save this policy page?")) return;
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
        title="Homepage"
        subtitle="Banners, top menu, announcement bar, and policy pages — no developer needed"
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

        <div className="space-y-4 border-t border-[var(--color-border)] pt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-[13px] tracking-[2px] uppercase font-medium">Homepage banners</h2>
            <AdminButton
              type="button"
              variant="secondary"
              onClick={() =>
                setContent((c) => ({
                  ...c,
                  heroBanners: [...(c.heroBanners || []), { image: "", href: "/", active: true }],
                }))
              }
            >
              Add banner
            </AdminButton>
          </div>
          <p className="text-[12px] text-neutral-500 normal-case tracking-normal">
            Images + optional schedule. Empty start/end means always on. Inactive banners are hidden.
          </p>
          {(content.heroBanners || []).map((banner, idx) => (
            <div key={idx} className="border border-[var(--color-border)] rounded-xl p-4 space-y-3">
              <ImageUploader
                label={`Banner ${idx + 1} image`}
                value={banner.image}
                folder="dutiheritage/banners"
                onChange={(url) =>
                  setContent((c) => {
                    const next = [...(c.heroBanners || [])];
                    next[idx] = { ...next[idx]!, image: url };
                    return { ...c, heroBanners: next };
                  })
                }
              />
              <div className="grid md:grid-cols-2 gap-3">
                <AdminInput
                  label="Link"
                  value={banner.href || ""}
                  onChange={(e) =>
                    setContent((c) => {
                      const next = [...(c.heroBanners || [])];
                      next[idx] = { ...next[idx]!, href: e.target.value };
                      return { ...c, heroBanners: next };
                    })
                  }
                  placeholder="/collections/new-arrivals"
                />
                <AdminInput
                  label="Headline"
                  value={banner.headline || ""}
                  onChange={(e) =>
                    setContent((c) => {
                      const next = [...(c.heroBanners || [])];
                      next[idx] = { ...next[idx]!, headline: e.target.value };
                      return { ...c, heroBanners: next };
                    })
                  }
                />
                <AdminInput
                  label="Starts"
                  type="datetime-local"
                  value={banner.startsAt ? banner.startsAt.slice(0, 16) : ""}
                  onChange={(e) =>
                    setContent((c) => {
                      const next = [...(c.heroBanners || [])];
                      next[idx] = {
                        ...next[idx]!,
                        startsAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                      };
                      return { ...c, heroBanners: next };
                    })
                  }
                />
                <AdminInput
                  label="Ends"
                  type="datetime-local"
                  value={banner.endsAt ? banner.endsAt.slice(0, 16) : ""}
                  onChange={(e) =>
                    setContent((c) => {
                      const next = [...(c.heroBanners || [])];
                      next[idx] = {
                        ...next[idx]!,
                        endsAt: e.target.value ? new Date(e.target.value).toISOString() : null,
                      };
                      return { ...c, heroBanners: next };
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-[12px] flex items-center gap-2 normal-case tracking-normal">
                  <input
                    type="checkbox"
                    checked={banner.active !== false}
                    onChange={(e) =>
                      setContent((c) => {
                        const next = [...(c.heroBanners || [])];
                        next[idx] = { ...next[idx]!, active: e.target.checked };
                        return { ...c, heroBanners: next };
                      })
                    }
                  />
                  Active
                </label>
                <button
                  type="button"
                  className="text-[12px] text-red-600"
                  onClick={() =>
                    setContent((c) => ({
                      ...c,
                      heroBanners: (c.heroBanners || []).filter((_, i) => i !== idx),
                    }))
                  }
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

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
