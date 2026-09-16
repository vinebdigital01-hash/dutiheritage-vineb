"use client";
import { SkeletonTable } from '@/components/ui/Skeleton';
import { useEffect, useMemo, useState } from "react";
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

type PickItem = { id: string; name: string; hint?: string; image?: string };

function PickMany({
  label,
  hint,
  searchPlaceholder,
  emptyList,
  items,
  selectedIds,
  onChange,
}: {
  label: string;
  hint: string;
  searchPlaceholder: string;
  emptyList: string;
  items: PickItem[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}) {
  const [q, setQ] = useState("");
  const selected = useMemo(() => new Set(selectedIds), [selectedIds]);
  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const query = q.trim().toLowerCase();
  const filtered = query
    ? items.filter(
        (i) =>
          i.name.toLowerCase().includes(query) ||
          (i.hint && i.hint.toLowerCase().includes(query))
      )
    : items;

  const toggle = (id: string) => {
    if (selected.has(id)) onChange(selectedIds.filter((x) => x !== id));
    else onChange([...selectedIds, id]);
  };

  const selectVisible = () => {
    const next = new Set(selectedIds);
    filtered.forEach((i) => next.add(i.id));
    onChange([...next]);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <label className="text-[12px] font-bold tracking-[1px] uppercase text-neutral-500">
          {label}
        </label>
        <p className="text-[12px] text-neutral-500">
          {selectedIds.length === 0
            ? "None picked yet"
            : `${selectedIds.length} selected`}
        </p>
      </div>
      <p className="text-[13px] text-neutral-600">{hint}</p>

      {selectedIds.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedIds.map((id) => {
            const item = byId.get(id);
            return (
              <button
                key={id}
                type="button"
                onClick={() => toggle(id)}
                className="inline-flex items-center gap-1.5 max-w-full rounded-full bg-neutral-100 border border-neutral-200 px-3 py-1 text-[13px] text-neutral-800 cursor-pointer hover:bg-neutral-200"
              >
                <span className="truncate">{item?.name || id}</span>
                <span className="text-neutral-400" aria-hidden>
                  ×
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="border border-[var(--color-border)] rounded-xl bg-white overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 border-b border-[var(--color-border)]">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") e.preventDefault();
            }}
            placeholder={searchPlaceholder}
            className="flex-1 border border-[var(--color-border)] bg-white px-3 py-2 text-[14px] text-black rounded-lg outline-none focus:border-black"
          />
          <div className="flex gap-2 shrink-0">
            <AdminButton
              type="button"
              variant="secondary"
              className="!px-3 !py-2"
              onClick={selectVisible}
              disabled={filtered.length === 0}
            >
              Select all shown
            </AdminButton>
            <AdminButton
              type="button"
              variant="ghost"
              className="!px-3 !py-2"
              onClick={() => onChange([])}
              disabled={selectedIds.length === 0}
            >
              Clear
            </AdminButton>
          </div>
        </div>
        <div className="max-h-64 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-8 text-[13px] text-neutral-500 text-center">{emptyList}</p>
          ) : filtered.length === 0 ? (
            <p className="px-4 py-8 text-[13px] text-neutral-500 text-center">
              Nothing matches “{q.trim()}”
            </p>
          ) : (
            filtered.map((item) => {
              const on = selected.has(item.id);
              return (
                <label
                  key={item.id}
                  className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer border-b border-neutral-100 last:border-b-0 ${
                    on ? "bg-neutral-50" : "hover:bg-neutral-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    className="accent-black w-4 h-4 cursor-pointer shrink-0"
                    checked={on}
                    onChange={() => toggle(item.id)}
                  />
                  {item.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.image}
                      alt=""
                      className="w-9 h-9 rounded object-cover bg-neutral-100 shrink-0"
                    />
                  ) : null}
                  <span className="min-w-0">
                    <span className="block text-[14px] text-black truncate">{item.name}</span>
                    {item.hint ? (
                      <span className="block text-[12px] text-neutral-500 truncate">{item.hint}</span>
                    ) : null}
                  </span>
                </label>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminCouponsPage() {
  const { show, Toast } = useToast();
  const [coupons, setCoupons] = useState<CouponDTO[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discountType: "PERCENT" as "PERCENT" | "FLAT" | "BUY_X_PERCENT" | "BUY_X_GET_Y_FREE",
    discountValue: "",
    minOrderAmount: "0",
    minQuantity: "2",
    freeQuantity: "1",
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

  const collectionName = useMemo(
    () => new Map(collections.map((c) => [c.id, c.name])),
    [collections]
  );

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.scope !== "ALL_PRODUCTS" && form.targetIds.length === 0) {
      show(
        form.scope === "SPECIFIC_CATEGORY"
          ? "Tick at least one category"
          : "Tick at least one product",
        "error"
      );
      return;
    }
    if (!window.confirm("Are you sure you want to create this coupon?")) return;
    setSaving(true);
    try {
      await adminFetch("/api/coupons", {
        method: "POST",
        body: JSON.stringify({
          code: form.code,
          discountType: form.discountType,
          discountValue: Number(form.discountValue) || 0,
          minOrderAmount: Number(form.minOrderAmount) || 0,
          minQuantity: Number(form.minQuantity) || 0,
          freeQuantity: Number(form.freeQuantity) || 0,
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
        minQuantity: "2",
        freeQuantity: "1",
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
      <PageHeader title="Discount codes" subtitle="Codes customers type at checkout. Turn Active off to stop a code." />

      <form onSubmit={create} className="bg-white border border-[var(--color-border)] rounded-xl p-5 mb-8 shadow-sm space-y-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
          <AdminInput label="Code *" required value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="DIWALI50" />
          <AdminSelect label="Discount Type" value={form.discountType} onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as any }))}>
            <option value="PERCENT">Percent Off (%)</option>
            <option value="FLAT">{`Flat Off (\u20B9)`}</option>
            <option value="BUY_X_PERCENT">Buy X, Get Y% Off</option>
            <option value="BUY_X_GET_Y_FREE">Buy X, Get Y Free</option>
          </AdminSelect>
          {form.discountType === "BUY_X_PERCENT" && (
            <>
              <AdminInput label="Min Quantity (Buy X) *" type="number" min={1} required value={form.minQuantity} onChange={(e) => setForm((f) => ({ ...f, minQuantity: e.target.value }))} placeholder="2" />
              <AdminInput label="Discount % (Y%) *" type="number" min={0} max={100} required value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} placeholder="15" />
            </>
          )}
          {form.discountType === "BUY_X_GET_Y_FREE" && (
            <>
              <AdminInput label="Min Quantity (Buy X) *" type="number" min={1} required value={form.minQuantity} onChange={(e) => setForm((f) => ({ ...f, minQuantity: e.target.value }))} placeholder="3" />
              <AdminInput label="Free Items (Get Y) *" type="number" min={1} required value={form.freeQuantity} onChange={(e) => setForm((f) => ({ ...f, freeQuantity: e.target.value }))} placeholder="1" />
            </>
          )}
          {(form.discountType === "PERCENT" || form.discountType === "FLAT") && (
            <>
              <AdminInput label="Value *" type="number" min={0} required value={form.discountValue} onChange={(e) => setForm((f) => ({ ...f, discountValue: e.target.value }))} />
              <AdminInput label={`Min order (\u20B9)`} type="number" min={0} value={form.minOrderAmount} onChange={(e) => setForm((f) => ({ ...f, minOrderAmount: e.target.value }))} />
            </>
          )}
        </div>

        {(form.discountType === "BUY_X_PERCENT" || form.discountType === "BUY_X_GET_Y_FREE") && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-[13px] text-blue-800">
            {form.discountType === "BUY_X_PERCENT"
              ? `Preview: Buy ${form.minQuantity || "X"} items, get ${form.discountValue || "Y"}% off`
              : `Preview: Buy ${form.minQuantity || "X"} items, get ${form.freeQuantity || "Y"} item(s) free (cheapest)`}
          </div>
        )}
        
        <div className="space-y-4 pt-4 border-t border-gray-100">
          <AdminSelect
            label="Coupon Scope"
            className="max-w-md"
            value={form.scope}
            onChange={(e) =>
              setForm((f) => ({ ...f, scope: e.target.value as typeof f.scope, targetIds: [] }))
            }
          >
            <option value="ALL_PRODUCTS">All Products</option>
            <option value="SPECIFIC_CATEGORY">Specific Categories</option>
            <option value="SPECIFIC_PRODUCTS">Specific Products</option>
          </AdminSelect>

          {form.scope === "SPECIFIC_CATEGORY" && (
            <PickMany
              label="Select Categories"
              hint="Search and tick — you can pick more than one. Click a name again to remove it."
              searchPlaceholder="Search categories"
              emptyList="No categories yet. Create them under Collections first."
              items={collections.map((c) => ({ id: c.id, name: c.name }))}
              selectedIds={form.targetIds}
              onChange={(targetIds) => setForm((f) => ({ ...f, targetIds }))}
            />
          )}

          {form.scope === "SPECIFIC_PRODUCTS" && (
            <PickMany
              label="Select Products"
              hint="Search and tick — you can pick more than one. Click a name again to remove it."
              searchPlaceholder="Search products"
              emptyList="No products yet. Add products first."
              items={products.map((p) => ({
                id: p.id,
                name: p.name,
                hint: collectionName.get(p.collectionId),
                image: p.image,
              }))}
              selectedIds={form.targetIds}
              onChange={(targetIds) => setForm((f) => ({ ...f, targetIds }))}
            />
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
                      {c.discountType === "PERCENT" && `${c.discountValue}%`}
                      {c.discountType === "FLAT" && `\u20B9${c.discountValue}`}
                      {c.discountType === "BUY_X_PERCENT" && `Buy ${c.minQuantity}, ${c.discountValue}% off`}
                      {c.discountType === "BUY_X_GET_Y_FREE" && `Buy ${c.minQuantity}, ${c.freeQuantity} free`}
                    </td>
                    <td className="p-4">
                      {c.scope === "ALL_PRODUCTS" && <Badge tone="info">All Products</Badge>}
                      {c.scope === "SPECIFIC_CATEGORY" && <Badge tone="neutral">{c.targetIds.length} Categories</Badge>}
                      {c.scope === "SPECIFIC_PRODUCTS" && <Badge tone="neutral">{c.targetIds.length} Products</Badge>}
                    </td>
                    <td className="p-4">
                      {c.minOrderAmount > 0 ? `\u20B9${c.minOrderAmount}` : "-"}
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
                        {c.active ? "Stop code" : "Start code"}
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

