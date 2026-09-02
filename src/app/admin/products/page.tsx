"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import {
  PageHeader,
  AdminButton,
  AdminInput,
  Badge,
  EmptyState,
  useToast,
} from "@/components/admin/ui";
import type { Product } from "@/types";

export default function AdminProductsPage() {
  const { show, Toast } = useToast();
  const [products, setProducts] = useState<(Product & { isActive?: boolean })[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const toggleAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map(p => p.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const handleBulkAction = async (actionType: string) => {
    if (selectedIds.size === 0) return;
    
    let action = 'update';
    let updates: any = {};
    
    if (actionType === 'delete') {
      if (!window.confirm("Are you sure you want to delete " + selectedIds.size + " products?")) return;
      action = 'delete';
    } else if (actionType === 'activate') {
      updates = { isActive: true };
    } else if (actionType === 'deactivate') {
      updates = { isActive: false };
    } else if (actionType === 'enable_cod') {
      updates = { codAvailable: true };
    } else if (actionType === 'disable_cod') {
      updates = { codAvailable: false };
    } else if (actionType === 'enable_partial_cod') {
      const amt = window.prompt("Enter Partial COD Advance amount (e.g. 500):", "500");
      if (amt === null) return;
      updates = { isPartialCOD: true, partialCODAdvance: Number(amt) || 0, codAvailable: true };
    } else if (actionType === 'disable_partial_cod') {
      updates = { isPartialCOD: false, partialCODAdvance: 0 };
    }

    setBulkActionLoading(true);
    try {
      await adminFetch('/api/products/bulk-update', {
        method: 'POST',
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          action,
          updates
        })
      });
      show("Bulk action applied successfully", 'success');
      setSelectedIds(new Set());
      await load();
    } catch (err: any) {
      show(err.message || 'Bulk action failed', 'error');
    } finally {
      setBulkActionLoading(false);
    }
  };


  
  const handleExportCSV = () => {
    if (!products || products.length === 0) {
      show("No products to export", "error");
      return;
    }
    const headers = [
      "id", "name", "slug", "price", "salePrice", "description", 
      "collectionId", "image", "images", "sizes", "colors", "tags", 
      "seoTitle", "seoDescription", "boughtLast7Days", "videoUrls", 
      "codAvailable", "isPartialCOD", "partialCODAdvance", "isActive"
    ];
    const rows = products.map(p => {
      const escapeStr = (str: any) => {
        if (!str) return "";
        return '"' + String(str).replace(/"/g, '""') + '"';
      };
      return [
        p.id,
        escapeStr(p.name),
        p.slug,
        p.price,
        p.salePrice || "",
        escapeStr(p.description),
        p.collectionId,
        p.image || "",
        escapeStr((p.images || []).join(",")),
        escapeStr((p.sizes || []).join(",")),
        escapeStr((p.colors || []).join(",")),
        escapeStr((p.tags || []).join(",")),
        escapeStr(p.seoTitle),
        escapeStr(p.seoDescription),
        p.boughtLast7Days || 0,
        escapeStr((p.videoUrls || []).join(",")),
        p.codAvailable !== false ? "true" : "false",
        p.isActive !== false ? "true" : "false"
      ].join(",");
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "products_export_" + new Date().toISOString().split('T')[0] + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    show("Exported successfully!", "success");
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminFetch<{ products: Product[] }>(
        "/api/products?all=1"
      );
      setProducts(data.products || []);
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

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(term) ||
        p.slug.toLowerCase().includes(term)
    );
  }, [products, q]);

  const softDelete = async (id: string) => {
    if (!confirm("Deactivate this product? It will hide from the store.")) return;
    setBusyId(id);
    try {
      await adminFetch(`/api/products/${id}`, { method: "DELETE" });
      show("Product deactivated");
      await load();
    } catch (e) {
      show(e instanceof AdminApiError ? e.message : "Delete failed", "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      {Toast}
      <PageHeader
        title="Products"
        subtitle={`${products.length} in catalog`}
        actions={
          <div className="flex flex-wrap gap-2">
            <AdminButton variant="secondary" onClick={handleExportCSV}>Export CSV</AdminButton>
              <Link href="/admin/products/bulk-import">
              <AdminButton variant="secondary">Bulk Import</AdminButton>
            </Link>
            <Link href="/admin/products/bulk-offers">
              <AdminButton variant="secondary">Bulk Offers</AdminButton>
            </Link>
            <Link href="/admin/products/new">
              <AdminButton>Add product</AdminButton>
            </Link>
          </div>
        }
      />

      <div className="mb-6 max-w-sm">
        <AdminInput
          label="Search"
          placeholder="Name or slug…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading ? (
        <p className="text-[13px] text-neutral-500 animate-pulse">Loading…</p>
      ) : filtered.length === 0 ? (
        <EmptyState
          title="No products found"
          description="Add your first product or clear the search."
          action={
            <Link href="/admin/products/new">
              <AdminButton>Add product</AdminButton>
            </Link>
          }
        />
      ) : (
        <>
          {selectedIds.size > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 flex items-center justify-between">
              <span className="text-sm font-medium text-blue-800">{selectedIds.size} selected</span>
              <div className="flex gap-2">
                <select 
                  className="text-sm border border-blue-200 rounded px-2 py-1 bg-white outline-none"
                  onChange={(e) => {
                    if (e.target.value) {
                      handleBulkAction(e.target.value);
                      e.target.value = "";
                    }
                  }}
                  disabled={bulkActionLoading}
                >
                  <option value="">-- Bulk Actions --</option>
                  <option value="activate">Activate</option>
                  <option value="deactivate">Deactivate</option>
                  <option value="enable_cod">Enable COD</option>
                  <option value="disable_cod">Disable COD</option>
                  <option value="enable_partial_cod">Enable Partial COD</option>
                  <option value="disable_partial_cod">Disable Partial COD</option>
                  <option value="delete">Delete</option>
                </select>
              </div>
            </div>
          )}
          <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead className="bg-neutral-50 text-[11px] tracking-[1px] uppercase text-neutral-500">
                <tr>
                  <th className="px-4 py-3 w-10"><input type="checkbox" className="accent-black" checked={filtered.length > 0 && selectedIds.size === filtered.length} onChange={toggleAll} /></th><th className="px-4 py-3 font-medium">Product</th>
                  <th className="px-4 py-3 font-medium">Price</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-[var(--color-border)] hover:bg-neutral-50/80"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3 min-w-[220px]">
                        <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-neutral-100 border border-[var(--color-border)] shrink-0">
                          {p.image && (
                            <Image
                              src={p.image}
                              alt={p.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          )}
                        </div>
                        <div>
                          <p className="font-medium leading-tight">{p.name}</p>
                          <p className="text-[11px] text-neutral-400 font-mono mt-0.5">
                            {p.slug}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {p.salePrice ? (
                        <>
                          <span className="text-[var(--color-sale)] font-medium">
                            ₹{p.salePrice.toLocaleString("en-IN")}
                          </span>
                          <span className="text-neutral-400 line-through ml-2 text-[12px]">
                            ₹{p.price.toLocaleString("en-IN")}
                          </span>
                        </>
                      ) : (
                        <>₹{p.price.toLocaleString("en-IN")}</>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={p.isActive === false ? "danger" : "success"}>
                        {p.isActive === false ? "Inactive" : "Active"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link
                        href={`/admin/products/${p.id}/edit`}
                        className="text-[12px] tracking-[1px] uppercase mr-3 hover:underline"
                      >
                        Edit
                      </Link>
                      <button
                        type="button"
                        disabled={busyId === p.id}
                        onClick={() => softDelete(p.id)}
                        className="text-[12px] tracking-[1px] uppercase text-red-600 hover:underline disabled:opacity-50"
                      >
                        Deactivate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </div>
        </>
        )}
    </div>
  );
}
