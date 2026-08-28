"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import {
  PageHeader,
  AdminButton,
  AdminInput,
  AdminTextarea,
  AdminSelect,
  useToast,
} from "@/components/admin/ui";
import { PRODUCT_SIZES, PRODUCT_TAG_OPTIONS } from "@/lib/admin-constants";
import { ImageUploader } from "@/components/admin/ImageUploader";
import type { Collection, Product } from "@/types";
import Image from "next/image";
import { FiX } from "react-icons/fi";

type FormState = {
  name: string;
  slug: string;
  price: string;
  salePrice: string;
  description: string;
  collectionId: string;
  image: string;
  images: string;
  sizes: string[];
  colors: string;
  tags: string[];
  seoTitle: string;
  seoDescription: string;
  boughtLast7Days: string;
  videoUrls: string;
  codAvailable: boolean;
  isActive: boolean;
};

const emptyForm = (): FormState => ({
  name: "",
  slug: "",
  price: "",
  salePrice: "",
  description: "",
  collectionId: "",
  image: "",
  images: "",
  sizes: ["S", "M", "L", "XL"],
  colors: "",
  tags: [],
  seoTitle: "",
  seoDescription: "",
  boughtLast7Days: "0",
  videoUrls: "",
  codAvailable: true,
  isActive: true,
});

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function productToForm(p: Product & { isActive?: boolean; codAvailable?: boolean }): FormState {
  return {
    name: p.name,
    slug: p.slug,
    price: String(p.price),
    salePrice: p.salePrice != null ? String(p.salePrice) : "",
    description: p.description || "",
    collectionId: p.collectionId,
    image: p.image,
    images: (p.images || []).join("\n"),
    sizes: p.sizes?.length ? p.sizes : [],
    colors: (p.colors || []).join(", "),
    tags: p.tags || [],
    seoTitle: p.seoTitle || "",
    seoDescription: p.seoDescription || "",
    boughtLast7Days: String(p.boughtLast7Days ?? 0),
    videoUrls: (p.videoUrls || []).join("\n"),
    codAvailable: p.codAvailable !== false,
    isActive: p.isActive !== false,
  };
}

export function ProductForm({ productId }: { productId?: string }) {
  const router = useRouter();
  const { show, Toast } = useToast();
  const [form, setForm] = useState<FormState>(emptyForm());
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(Boolean(productId));
  const [newSize, setNewSize] = useState("");
  const [newTag, setNewTag] = useState("");
  const [saving, setSaving] = useState(false);
  const isEdit = Boolean(productId);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const colRes = await adminFetch<{ collections: Collection[] }>(
          "/api/collections?all=1"
        );
        if (!cancelled) setCollections(colRes.collections || []);

        if (productId) {
          const res = await adminFetch<{ product: Product }>(
            `/api/products/${productId}`
          );
          if (!cancelled && res.product) {
            setForm(productToForm(res.product));
          }
        }
      } catch (e) {
        show(e instanceof AdminApiError ? e.message : "Load failed", "error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleSize = (size: string) => {
    setForm((prev) => ({
      ...prev,
      sizes: prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size],
    }));
  };

  const toggleTag = (tag: string) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm("Are you sure you want to save this product?")) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        slug: form.slug.trim() || slugify(form.name),
        price: Number(form.price),
        salePrice: form.salePrice ? Number(form.salePrice) : null,
        description: form.description,
        collectionId: form.collectionId,
        image: form.image.trim(),
        images: form.images
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        sizes: form.sizes,
        colors: form.colors
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        tags: form.tags,
        seoTitle: form.seoTitle || undefined,
        seoDescription: form.seoDescription || undefined,
        boughtLast7Days: Number(form.boughtLast7Days) || 0,
        videoUrls: form.videoUrls
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean),
        codAvailable: form.codAvailable,
        isActive: form.isActive,
      };

      if (!payload.name || !payload.image || !payload.collectionId) {
        throw new Error("Name, image, and collection are required");
      }
      if (Number.isNaN(payload.price)) throw new Error("Valid price required");

      if (isEdit && productId) {
        await adminFetch(`/api/products/${productId}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        show("Product updated");
      } else {
        const res = await adminFetch<{ product: Product }>("/api/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        show("Product created");
        router.push(`/admin/products/${res.product.id}/edit`);
        return;
      }
    } catch (err) {
      show(
        err instanceof AdminApiError || err instanceof Error
          ? err.message
          : "Save failed",
        "error"
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="text-[13px] text-neutral-500 animate-pulse">Loading form…</p>
    );
  }

  return (
    <div>
      {Toast}
      <PageHeader
        title={isEdit ? "Edit product" : "New product"}
        subtitle="Full catalog fields — SEO, sizes, COD, media"
        actions={
          <Link href="/admin/products">
            <AdminButton variant="secondary">Back to list</AdminButton>
          </Link>
        }
      />

      <form
        onSubmit={onSubmit}
        className="bg-white border border-[var(--color-border)] rounded-xl p-5 md:p-8 shadow-sm space-y-8"
      >
        <section className="grid md:grid-cols-2 gap-5">
          <AdminInput
            label="Name *"
            required
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              setForm((prev) => ({
                ...prev,
                name,
                slug: prev.slug && isEdit ? prev.slug : slugify(name),
              }));
            }}
          />
          <AdminInput
            label="Slug"
            value={form.slug}
            onChange={(e) => set("slug", e.target.value)}
          />
          <AdminInput
            label="Price (₹) *"
            type="number"
            min={0}
            required
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
          />
          <AdminInput
            label="Sale price (₹)"
            type="number"
            min={0}
            value={form.salePrice}
            onChange={(e) => set("salePrice", e.target.value)}
          />
          <AdminSelect
            label="Collection *"
            required
            value={form.collectionId}
            onChange={async (e) => {
              if (e.target.value === "CREATE_NEW") {
                const name = window.prompt("Enter new collection name:");
                if (!name?.trim()) {
                  set("collectionId", "");
                  return;
                }
                try {
                  const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
                  const res = await adminFetch<{ collection: Collection }>("/api/collections", {
                    method: "POST",
                    body: JSON.stringify({ name: name.trim(), slug, isActive: true })
                  });
                  setCollections(prev => [...prev, res.collection]);
                  set("collectionId", res.collection.id);
                  show("Collection created!", "success");
                } catch (err: any) {
                  show(err.message || "Failed to create collection", "error");
                  set("collectionId", "");
                }
              } else {
                set("collectionId", e.target.value);
              }
            }}
          >
            <option value="">Select collection</option>
            <option value="CREATE_NEW">+ Create new collection...</option>
            {collections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </AdminSelect>
          <AdminInput
            label="Bought last 7 days"
            type="number"
            min={0}
            value={form.boughtLast7Days}
            onChange={(e) => set("boughtLast7Days", e.target.value)}
          />
        </section>

        <AdminTextarea
          label="Description"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />

        <section className="space-y-6 border border-[var(--color-border)] rounded-xl p-5 bg-neutral-50/50">
          <div>
            <p className="text-[12px] tracking-[1px] uppercase text-neutral-500 mb-1">
              Product media
            </p>
            <p className="text-[12px] text-neutral-400 mb-4">
              Files are compressed in the browser at high quality (~92%) before upload — smaller files, sharp photos.
            </p>
            <ImageUploader
              label="Main image *"
              value={form.image}
              onChange={(url) => set("image", url)}
            />
            <div className="mt-3">
              <AdminInput
                label="Or paste main image URL"
                placeholder="https://… or /images/…"
                value={form.image}
                onChange={(e) => set("image", e.target.value)}
              />
            </div>
          </div>

          <div>
            <ImageUploader
              label="Gallery images"
              multiple
              onChange={() => {}}
              onAdd={(url) => {
                setForm((prev) => ({
                  ...prev,
                  images: prev.images
                    ? `${prev.images}\n${url}`
                    : url,
                }));
              }}
            />
            {form.images.trim() && (
              <div className="flex flex-wrap gap-2 mt-3">
                {form.images
                  .split("\n")
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((url) => (
                    <div
                      key={url}
                      className="relative w-16 h-16 rounded-lg overflow-hidden border bg-white"
                    >
                      <Image
                        src={url}
                        alt=""
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                      <button
                        type="button"
                        className="absolute top-0.5 right-0.5 bg-black/70 text-white p-0.5 rounded"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            images: prev.images
                              .split("\n")
                              .map((s) => s.trim())
                              .filter((u) => u && u !== url)
                              .join("\n"),
                          }))
                        }
                        aria-label="Remove gallery image"
                      >
                        <FiX className="text-xs" />
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </section>

        <AdminInput
          label="Colors (comma-separated)"
          placeholder="Emerald, Black"
          value={form.colors}
          onChange={(e) => set("colors", e.target.value)}
        />

        <AdminTextarea
          label="Video URLs (one per line)"
          value={form.videoUrls}
          onChange={(e) => set("videoUrls", e.target.value)}
        />

        <div>
          <p className="text-[12px] tracking-[1px] uppercase text-neutral-500 mb-3">
            Sizes
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {Array.from(new Set([...PRODUCT_SIZES, ...form.sizes])).map((size) => (
              <button
                key={size}
                type="button"
                onClick={() => toggleSize(size)}
                className={`px-3 py-1.5 text-[12px] rounded-lg border transition-colors ${
                  form.sizes.includes(size)
                    ? "bg-black text-white border-black"
                    : "bg-white border-[var(--color-border)] hover:border-black text-gray-500"
                }`}
              >
                {size}
              </button>
            ))}
          </div>
          <div className="flex gap-2 max-w-[300px]">
            <AdminInput 
              label="" 
              placeholder="Add custom size..." 
              value={newSize} 
              onChange={e => setNewSize(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (newSize.trim() && !form.sizes.includes(newSize.trim())) {
                    toggleSize(newSize.trim());
                  }
                  setNewSize("");
                }
              }}
            />
            <button 
              type="button" 
              onClick={() => {
                if (newSize.trim() && !form.sizes.includes(newSize.trim())) {
                  toggleSize(newSize.trim());
                }
                setNewSize("");
              }}
              className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 h-[42px] mt-[6px]"
            >
              Add
            </button>
          </div>
        </div>

        <div>
          <p className="text-[12px] tracking-[1px] uppercase text-neutral-500 mb-3">
            Tags
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            {Array.from(new Set([...PRODUCT_TAG_OPTIONS, ...form.tags])).map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 text-[12px] rounded-lg border transition-colors ${
                  form.tags.includes(tag)
                    ? "bg-black text-white border-black"
                    : "bg-white border-[var(--color-border)] hover:border-black text-gray-500"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
          <div className="flex gap-2 max-w-[300px]">
            <AdminInput 
              label="" 
              placeholder="Add custom tag..." 
              value={newTag} 
              onChange={e => setNewTag(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (newTag.trim() && !form.tags.includes(newTag.trim())) {
                    toggleTag(newTag.trim());
                  }
                  setNewTag("");
                }
              }}
            />
            <button 
              type="button" 
              onClick={() => {
                if (newTag.trim() && !form.tags.includes(newTag.trim())) {
                  toggleTag(newTag.trim());
                }
                setNewTag("");
              }}
              className="px-4 py-2 bg-gray-100 rounded-lg text-sm font-medium hover:bg-gray-200 h-[42px] mt-[6px]"
            >
              Add
            </button>
          </div>
        </div>

        <section className="grid md:grid-cols-2 gap-5">
          <AdminInput
            label="SEO title"
            value={form.seoTitle}
            onChange={(e) => set("seoTitle", e.target.value)}
          />
          <AdminTextarea
            label={`SEO description (${form.seoDescription.length} chars)`}
            value={form.seoDescription}
            onChange={(e) => set("seoDescription", e.target.value)}
            maxLength={200}
          />
        </section>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-[14px] cursor-pointer">
            <input
              type="checkbox"
              checked={form.codAvailable}
              onChange={(e) => set("codAvailable", e.target.checked)}
              className="accent-black w-4 h-4"
            />
            COD available for this product
          </label>
          <label className="flex items-center gap-2 text-[14px] cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => set("isActive", e.target.checked)}
              className="accent-black w-4 h-4"
            />
            Active on storefront
          </label>
        </div>

        <div className="flex gap-3 pt-2 border-t border-[var(--color-border)]">
          <AdminButton type="submit" disabled={saving}>
            {saving ? "Saving…" : isEdit ? "Save changes" : "Create product"}
          </AdminButton>
          <Link href="/admin/products">
            <AdminButton type="button" variant="ghost">
              Cancel
            </AdminButton>
          </Link>
        </div>
      </form>
    </div>
  );
}
