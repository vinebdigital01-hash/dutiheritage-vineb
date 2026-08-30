import { SkeletonTable } from '@/components/ui/Skeleton';
"use client";

ï»¿import { useEffect, useState } from "react";
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
import type { CouponDTO } from "@/lib/coupons";
import type { Product, Collection } from "@/types";

export default function AdminCouponsPage() {
  const { show, Toast } = useToast();
  const [coupons, setCoupons] = useState<CouponDTO[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discountType: "PERCENT" as "PERCENT" | "FLAT",
    discountValue: "",
    minOrderAmount: "0",
    scope: "ALL_PRODUCTS" as "ALL_PRODUCTS" | "SPECIFIC_PRODUCTS" | "SPECIFIC_CATEGORY",
    targetIds: [] as string[]
  });

  const load = async () => {
    setLoading(true);
    try {
      const [cRes, pRes, colRes] = await Promise.all([
        adminFetch<{ coupons: CouponDTO[] }>("/api/coupons"),
        adminFetch<{ products: Product[] }>("/api/products?all=1"),
        adminFetch<{ collections: Collection[] }>("/api/collections?all=1")
      ]);
      setCoupons(cRes.coupons || []);
      setProducts(pRes.products || []);
      setCollections(colRes.collections || []);
    } catch (e) {
      show(e instanceof AdminApiError ? e.message : "Failed to load", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!window.confirm("Are you sure you want to create this coupon?")) return;
    setSaving(true);
    try {
      await adminFetch("/api/coupons", {
        method: "POST",
        body: JSON.stringify({
          code: form.code,
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          minOrderAmount: Number(form.minOrderAmount) || 0,
          scope: form.scope,
          targetIds: form.targetIds,
          active: true,
        }),
      });
      setForm({
        code: "",
        discountType: "PERCENT",
        discountValue: "",
        minOrderAmount: "0",
        scope: "ALL_PRODUCTS",
        targetIds: []
      });
      show("Coupon created");
      await load();
    } catch (err) {
      show(err instanceof AdminApiError ? err.message : "Create failed", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (c: CouponDTO) => {
    if (!window.confirm(`Are you sure you want to ${c.active ? "disable" : "enable"} this coupon?`)) return;
    try {
      await adminFetch(`/api/coupons/${c.id}`, {
        method: "PUT",
        body: JSON.stringify({ active: !c.active }),
      });
      show(c.active ? "Coupon disabled" : "Coupon enabled");
      await load();
    } catch (err) {
      show(err instanceof AdminApiError ? err.message : "Update failed", "error");
    }
  };

  const deleteCoupon = async (c: CouponDTO) => {
    if (!window.confirm(`Are you sure you want to permanently delete ${c.code}?`)) return;
    try {
      await adminFetch(`/api/coupons/${c.id}`, { method: "DELETE" });
      show("Coupon deleted");
      await load();
    } catch (err) {
      show(err instanceof AdminApiError ? err.message : "Delete failed", "error");
    }
  };

  return (
    <div>
      {Toast}
      <PageHeader title="Coupons" subtitle="Discount codes for checkout" />

      <form onSubmit={create} className="bg-white border border-[var(--color-border)] rounded-xl p-5 mb-8 shadow-sm space-y-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <AdminInput label="Code *" required value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="DIWALI50" />
          <AdminSelect label="Type" value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as "PERCENT" | "FLAT" }))}>
            <option value="PERCENT">Percent %</option>
            <option value="FLAT">Flat â‚¹</option>
          </AdminSelect>
          <AdminInput label="Value *" type="number" min={0} required value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} />
          <AdminInput label="Min order â‚¹" type="number" min={0} value={form.minOrderAmount} onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))} />
        </div>
        
        <div className="grid md:grid-cols-2 gap-4 items-start pt-4 border-t border-gray-100">
          <AdminSelect label="Coupon Scope" value={form.scope} onChange={(e) => setForm((f) => ({ ...f, scope: e.target.value as any, targetIds: [] }))}>
            <option value="ALL_PRODUCTS">All Products</option>
            <option value="SPECIFIC_CATEGORY">Specific Categories</option>
            <option value="SPECIFIC_PRODUCTS">Specific Products</option>
          </AdminSelect>
          
          {form.scope !== "ALL_PRODUCTS" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold tracking-[1px] uppercase text-neutral-500">
                Select Targets (Hold Ctrl/Cmd to pick multiple)
              </label>
              <select 
                multiple
                className="w-full bg-neutral-50/50 border border-neutral-200 rounded-lg px-3 py-2 text-[14px] text-neutral-900 focus:outline-none focus:ring-1 focus:ring-neutral-900 focus:border-neutral-900 h-32"
                value={form.targetIds}
                onChange={(e) => {
                  const values = Array.from(e.target.selectedOptions, option => option.value);
                  setForm(f => ({ ...f, targetIds: values }));
                }}
              >
                {form.scope === "SPECIFIC_CATEGORY" 
                  ? collections.map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                  : products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)
                }
              </select>
            </div>
          )}
        </div>
        
        <div className="flex justify-end pt-2">
          <AdminButton type="submit" disabled={saving}>
            {saving ? "Saving..." : "Create Coupon"}
          </AdminButton>
        </div>
      </form>

      {loading ? (
        <SkeletonTable />
      ) : coupons.length === 0 ? (
        <EmptyState title="No coupons yet" description="Create a discount code above to get started." />
      ) : (
        <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50/50 text-[11px] font-bold tracking-[1px] uppercase text-neutral-500">
                  <th className="p-4 border-b border-neutral-100 font-medium">Code</th>
                  <th className="p-4 border-b border-neutral-100 font-medium">Discount</th>
                  <th className="p-4 border-b border-neutral-100 font-medium">Scope</th>
                  <th className="p-4 border-b border-neutral-100 font-medium">Min Order</th>
                  <th className="p-4 border-b border-neutral-100 font-medium">Uses</th>
                  <th className="p-4 border-b border-neutral-100 font-medium">Status</th>
                  <th className="p-4 border-b border-neutral-100 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="text-[13px] divide-y divide-neutral-100">
                {coupons.map((c) => (
                  <tr key={c.id} className="hover:bg-neutral-50/50 transition-colors">
                    <td className="p-4 font-mono font-medium text-[14px]">
                      {c.code}
                    </td>
                    <td className="p-4">
                      {c.discountType === "PERCENT" ? `${c.discountValue}%` : `â‚¹${c.discountValue}`}
                    </td>
                    <td className="p-4">
                      {c.scope === "ALL_PRODUCTS" && <Badge tone="info">All Products</Badge>}
                      {c.scope === "SPECIFIC_CATEGORY" && <Badge tone="neutral">{c.targetIds.length} Categories</Badge>}
                      {c.scope === "SPECIFIC_PRODUCTS" && <Badge tone="neutral">{c.targetIds.length} Products</Badge>}
                    </td>
                    <td className="p-4">
                      {c.minOrderAmount > 0 ? `â‚¹${c.minOrderAmount}` : "-"}
                    </td>
                    <td className="p-4 text-neutral-500">{c.usedCount}</td>
                    <td className="p-4">
                      <Badge tone={c.active ? "success" : "neutral"}>
                        {c.active ? "Active" : "Disabled"}
                      </Badge>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => toggleActive(c)}
                        className="text-[12px] font-medium text-[#111] hover:underline mr-4"
                      >
                        {c.active ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => deleteCoupon(c)}
                        className="text-[12px] font-medium text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

