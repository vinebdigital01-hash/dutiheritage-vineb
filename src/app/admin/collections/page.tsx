"use client";

import { useEffect, useState } from "react";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import {
  PageHeader,
  AdminButton,
  AdminInput,
  Badge,
  EmptyState,
  useToast,
} from "@/components/admin/ui";
import type { Collection } from "@/types";

export default function AdminCollectionsPage() {
  const { show, Toast } = useToast();
  const [collections, setCollections] = useState<
    (Collection & { isActive?: boolean })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [saving, setSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminFetch<{ collections: Collection[] }>(
        "/api/collections?all=1"
      );
      setCollections(data.collections || []);
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

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm("Are you sure you want to create this collection?")) return;
    setSaving(true);
    try {
      await adminFetch("/api/collections", {
        method: "POST",
        body: JSON.stringify({ name, slug: slug || undefined }),
      });
      setName("");
      setSlug("");
      show("Collection created");
      await load();
    } catch (err) {
      show(err instanceof AdminApiError ? err.message : "Create failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async (id: string) => {
    if (!window.confirm("Are you sure you want to save these changes?")) return;
    try {
      await adminFetch(`/api/collections/${id}`, {
        method: "PUT",
        body: JSON.stringify({ name: editName }),
      });
      setEditId(null);
      show("Collection updated");
      await load();
    } catch (err) {
      show(err instanceof AdminApiError ? err.message : "Update failed", "error");
    }
  };

  const deactivate = async (id: string) => {
    if (!confirm("Deactivate this collection?")) return;
    try {
      await adminFetch(`/api/collections/${id}`, { method: "DELETE" });
      show("Collection deactivated");
      await load();
    } catch (err) {
      show(err instanceof AdminApiError ? err.message : "Failed", "error");
    }
  };

  return (
    <div>
      {Toast}
      <PageHeader
        title="Collections"
        subtitle="Organize products into storefront sections"
      />

      <form
        onSubmit={create}
        className="bg-white border border-[var(--color-border)] rounded-xl p-5 mb-8 shadow-sm grid md:grid-cols-[1fr_1fr_auto] gap-4 items-end"
      >
        <AdminInput
          label="Name *"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Wedding Collection"
        />
        <AdminInput
          label="Slug (optional)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="auto from name"
        />
        <AdminButton type="submit" disabled={saving}>
          {saving ? "Adding…" : "Add collection"}
        </AdminButton>
      </form>

      {loading ? (
        <p className="text-[13px] text-neutral-500 animate-pulse">Loading…</p>
      ) : collections.length === 0 ? (
        <EmptyState
          title="No collections"
          description="Create a collection, then assign products to it."
        />
      ) : (
        <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-neutral-50 text-[11px] tracking-[1px] uppercase text-neutral-500">
              <tr>
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Slug</th>
                <th className="px-5 py-3 font-medium">Products</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {collections.map((c) => (
                <tr key={c.id} className="border-t border-[var(--color-border)]">
                  <td className="px-5 py-3">
                    {editId === c.id ? (
                      <input
                        className="border px-2 py-1 rounded w-full max-w-[200px]"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                      />
                    ) : (
                      c.name
                    )}
                  </td>
                  <td className="px-5 py-3 font-mono text-[12px] text-neutral-500">
                    {c.slug}
                  </td>
                  <td className="px-5 py-3">{c.productCount ?? 0}</td>
                  <td className="px-5 py-3">
                    <Badge tone={c.isActive === false ? "danger" : "success"}>
                      {c.isActive === false ? "Inactive" : "Active"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right whitespace-nowrap">
                    {editId === c.id ? (
                      <>
                        <button
                          type="button"
                          className="text-[12px] uppercase tracking-[1px] mr-3 hover:underline"
                          onClick={() => saveEdit(c.id)}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          className="text-[12px] uppercase tracking-[1px] text-neutral-400"
                          onClick={() => setEditId(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="text-[12px] uppercase tracking-[1px] mr-3 hover:underline"
                          onClick={() => {
                            setEditId(c.id);
                            setEditName(c.name);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="text-[12px] uppercase tracking-[1px] text-red-600 hover:underline"
                          onClick={() => deactivate(c.id)}
                        >
                          Deactivate
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
