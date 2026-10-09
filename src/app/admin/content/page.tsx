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
import { useConfirm } from "@/components/ConfirmDialog";
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
    gstin?: string;
    instagramUrl?: string;
    facebookUrl?: string;
    pinterestUrl?: string;
    whatsappUrl?: string;
      socialLinks?: { url: string }[];
  };
};

const POLICY_SLUGS = [
  { slug: "about", title: "About Us" },
  { slug: "contact-us", title: "Contact Us" },
  { slug: "privacy-policy", title: "Privacy Policy" },
  { slug: "return-exchange", title: "Cancellation, Return & Refund" },
  { slug: "shipping", title: "Delivery & Shipping" },
  { slug: "terms-conditions", title: "Terms & Conditions" },
];

export default function AdminContentPage() {
  const { show, Toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [content, setContent] = useState<SiteContent>({});
  const [navLinks, setNavLinks] = useState<{label: string, slug: string}[]>([]);
  const [slugsText, setSlugsText] = useState("");
  const [allCollections, setAllCollections] = useState<{name:string, slug:string, productCount?: number}[]>([]);
  const [activeSlugs, setActiveSlugs] = useState<string[]>([]);
  const [policySlug, setPolicySlug] = useState(POLICY_SLUGS[0]!.slug);
  const [policyTitle, setPolicyTitle] = useState(POLICY_SLUGS[0]!.title);
  const [policyBody, setPolicyBody] = useState("");
  const [savingPolicy, setSavingPolicy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const [data, collData] = await Promise.all([
          adminFetch<{ content: SiteContent }>("/api/site-content"),
          adminFetch<{ collections: {name:string, slug:string, productCount: number}[] }>("/api/collections?all=1").catch(() => ({ collections: [] }))
        ]);
        const c = data.content || {};
        setAllCollections(collData.collections || []);
        setContent(c);
        setNavLinks(c.headerNavLinks && c.headerNavLinks.length > 0 ? c.headerNavLinks : [
          { label: "Home", slug: "/" },
          { label: "Best Sellers", slug: "/collections/best-sellers" },
          { label: "On Sale", slug: "/collections/on-sale" }
        ]);
        setSlugsText((c.homepageSlugs || []).join("\n"));
        setActiveSlugs(c.homepageSlugs || []);
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
    if (!(await confirm({ title: "Update site content", description: "Save homepage and footer content?", confirmText: "Save" }))) return;
    setSaving(true);
    try {
      const headerNavLinks = navLinks.filter(l => l.label && l.slug);

      const homepageSlugs = activeSlugs;

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
    if (!(await confirm({ title: "Save policy page", description: "Publish this policy page?", confirmText: "Save" }))) return;
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
      {ConfirmDialog}
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

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-[13px] tracking-[2px] uppercase font-medium">Header Navigation Links</h2>
              <p className="text-[12px] text-neutral-500">Links shown in the top menu bar</p>
            </div>
            <AdminButton
              type="button"
              variant="secondary"
              onClick={() => setNavLinks([...navLinks, { label: "", slug: "/" }])}
            >
              Add Link
            </AdminButton>
          </div>
          
          <div className="space-y-3">
            {navLinks.map((link, idx) => (
              <div key={idx} className="flex items-center gap-3 bg-neutral-50 p-3 rounded-lg border border-[var(--color-border)]">
                <div className="flex-1">
                  <label className="block text-[11px] text-neutral-500 mb-1">Link Name</label>
                  <input
                    type="text"
                    value={link.label}
                    onChange={(e) => {
                      const updated = [...navLinks];
                      updated[idx].label = e.target.value;
                      setNavLinks(updated);
                    }}
                    placeholder="e.g. Best Sellers"
                    className="w-full bg-white border border-[var(--color-border)] rounded px-2 py-1.5 text-[13px]"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[11px] text-neutral-500 mb-1">Destination URL</label>
                  <input
                    type="text"
                    value={link.slug}
                    onChange={(e) => {
                      const updated = [...navLinks];
                      updated[idx].slug = e.target.value;
                      setNavLinks(updated);
                    }}
                    placeholder="e.g. /collections/best-sellers"
                    className="w-full bg-white border border-[var(--color-border)] rounded px-2 py-1.5 text-[13px] font-mono"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const updated = [...navLinks];
                    updated.splice(idx, 1);
                    setNavLinks(updated);
                  }}
                  className="mt-5 text-red-500 hover:text-red-700 text-[12px] px-2"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-[13px] tracking-[2px] uppercase font-medium">Homepage Collections</h2>
          <p className="text-[12px] text-neutral-500">
            Check the collections you want to show on the homepage, and drag them up or down to reorder.
            Note: Empty collections are automatically hidden on the website.
          </p>
          <div className="border border-[var(--color-border)] rounded-xl overflow-hidden bg-white">
            {allCollections.length === 0 ? (
              <div className="p-4 text-[13px] text-neutral-500">No collections found. Create some first.</div>
            ) : (
              <ul className="divide-y divide-[var(--color-border)] max-h-[400px] overflow-y-auto">
                {activeSlugs.map((slug, idx) => {
                  const coll = allCollections.find(c => c.slug === slug);
                  if (!coll) return null;
                  return (
                    <li
                      key={slug}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("text/plain", idx.toString())}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        const fromIdx = parseInt(e.dataTransfer.getData("text/plain"), 10);
                        const toIdx = idx;
                        if (fromIdx === toIdx || isNaN(fromIdx)) return;
                        setActiveSlugs((prev) => {
                          const next = [...prev];
                          const [removed] = next.splice(fromIdx, 1);
                          next.splice(toIdx, 0, removed);
                          return next;
                        });
                      }}
                      className="flex items-center gap-3 p-3 bg-neutral-50 cursor-move hover:bg-neutral-100 transition-colors"
                    >
                      <div className="text-neutral-400 cursor-move">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="8" y1="6" x2="21" y2="6"></line>
                          <line x1="8" y1="12" x2="21" y2="12"></line>
                          <line x1="8" y1="18" x2="21" y2="18"></line>
                          <line x1="3" y1="6" x2="3.01" y2="6"></line>
                          <line x1="3" y1="12" x2="3.01" y2="12"></line>
                          <line x1="3" y1="18" x2="3.01" y2="18"></line>
                        </svg>
                      </div>
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() => {
                          setActiveSlugs(prev => prev.filter(s => s !== slug));
                        }}
                        className="rounded border-neutral-300 text-black focus:ring-black cursor-pointer"
                      />
                      <span className="text-[13px] font-medium">{coll.name} <span className="text-[11px] text-neutral-400 font-normal">({coll.productCount || 0} items)</span></span>
                      <span className="text-[11px] text-neutral-400 ml-auto font-mono">{coll.slug}</span>
                    </li>
                  );
                })}
                {allCollections.filter(c => !activeSlugs.includes(c.slug)).map(coll => (
                  <li
                    key={coll.slug}
                    className="flex items-center gap-3 p-3 hover:bg-neutral-50 transition-colors"
                  >
                    <div className="w-4 h-4"></div> {/* spacer for drag icon */}
                    <input
                      type="checkbox"
                      checked={false}
                      onChange={() => {
                        setActiveSlugs(prev => [...prev, coll.slug]);
                      }}
                      className="rounded border-neutral-300 text-black focus:ring-black cursor-pointer"
                    />
                    <span className="text-[13px] text-neutral-600">{coll.name} <span className="text-[11px] text-neutral-400 font-normal">({coll.productCount || 0} items)</span></span>
                    <span className="text-[11px] text-neutral-400 ml-auto font-mono">{coll.slug}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

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
          <AdminInput
            label="Footer GSTIN"
            value={content.footer?.gstin || ""}
            onChange={(e) =>
              setContent((c) => ({
                ...c,
                footer: { ...c.footer, gstin: e.target.value },
              }))
            }
          />
          <AdminInput
            label="Instagram URL"
            value={content.footer?.instagramUrl || ""}
            onChange={(e) =>
              setContent((c) => ({
                ...c,
                footer: { ...c.footer, instagramUrl: e.target.value },
              }))
            }
          />
          <AdminInput
            label="Facebook URL"
            value={content.footer?.facebookUrl || ""}
            onChange={(e) =>
              setContent((c) => ({
                ...c,
                footer: { ...c.footer, facebookUrl: e.target.value },
              }))
            }
          />
          <AdminInput
            label="Pinterest URL"
            value={content.footer?.pinterestUrl || ""}
            onChange={(e) =>
              setContent((c) => ({
                ...c,
                footer: { ...c.footer, pinterestUrl: e.target.value },
              }))
            }
          />
          <AdminInput
            label="WhatsApp URL"
            value={content.footer?.whatsappUrl || ""}
            onChange={(e) =>
              setContent((c) => ({
                ...c,
                footer: { ...c.footer, whatsappUrl: e.target.value },
              }))
            }
            placeholder="https://wa.me/917017194982"
          />
        </div>
        <p className="text-xs text-[var(--color-text-muted)] -mt-2">
          Empty social URLs hide the icon in the storefront footer. Use full https links.
        </p>
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
