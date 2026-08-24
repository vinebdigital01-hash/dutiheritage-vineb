"use client";

import { useEffect, useState } from "react";
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

export default function AdminCouponsPage() {
  const { show, Toast } = useToast();
  const [coupons, setCoupons] = useState<CouponDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    code: "",
    discountType: "PERCENT" as "PERCENT" | "FLAT",
    discountValue: "",
    minOrderAmount: "0",
  });

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminFetch<{ coupons: CouponDTO[] }>("/api/coupons");
      setCoupons(data.coupons || []);
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
    setSaving(true);
    try {
      await adminFetch("/api/coupons", {
        method: "POST",
        body: JSON.stringify({
          code: form.code,
          discountType: form.discountType,
          discountValue: Number(form.discountValue),
          minOrderAmount: Number(form.minOrderAmount) || 0,
          scope: "ALL_PRODUCTS",
          active: true,
        }),
      });
      setForm({
        code: "",
        discountType: "PERCENT",
        discountValue: "",
        minOrderAmount: "0",
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

  return (
    <div>
      {Toast}
      <PageHeader
        title="Coupons"
        subtitle="Discount codes for checkout"
      />

      <form
        onSubmit={create}
        className="bg-white border border-[var(--color-border)] rounded-xl p-5 mb-8 shadow-sm grid md:grid-cols-2 lg:grid-cols-5 gap-4 items-end"
      >
        <AdminInput
          label="Code *"
          required
          value={form.code}
          onChange={(e) =>
            setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
          }
          placeholder="DIWALI50"
        />
        <AdminSelect
          label="Type"
          value={form.discountType}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              discountType: e.target.value as "PERCENT" | "FLAT",
            }))
          }
        >
          <option value="PERCENT">Percent %</option>
          <option value="FLAT">Flat ₹</option>
        </AdminSelect>
        <AdminInput
          label="Value *"
          type="number"
          min={0}
          required
          value={form.discountValue}
          onChange={(e) =>
            setForm((f) => ({ ...f, discountValue: e.target.value }))
          }
        />
        <AdminInput
          label="Min order ₹"
          type="number"
          min={0}
          value={form.minOrderAmount}
          onChange={(e) =>
            setForm((f) => ({ ...f, minOrderAmount: e.target.value }))
          }
        />
        <AdminButton type="submit" disabled={saving}>
          {saving ? "Saving…" : "Create"}
        </AdminButton>
      </form>

      {loading ? (
        <p className="text-[13px] text-neutral-500 animate-pulse">Loading…</p>
      ) : coupons.length === 0 ? (
        <EmptyState title="No coupons yet" description="Create your first code above." />
      ) : (
        <div className="bg-white border border-[var(--color-border)] rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left text-[13px]">
            <thead className="bg-neutral-50 text-[11px] tracking-[1px] uppercase text-neutral-500">
              <tr>
                <th className="px-5 py-3 font-medium">Code</th>
                <th className="px-5 py-3 font-medium">Discount</th>
                <th className="px-5 py-3 font-medium">Min order</th>
                <th className="px-5 py-3 font-medium">Used</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Toggle</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((c) => (
                <tr key={c.id} className="border-t border-[var(--color-border)]">
                  <td className="px-5 py-3 font-mono font-medium">{c.code}</td>
                  <td className="px-5 py-3">
                    {c.discountType === "PERCENT"
                      ? `${c.discountValue}%`
                      : `₹${c.discountValue}`}
                  </td>
                  <td className="px-5 py-3">₹{c.minOrderAmount}</td>
                  <td className="px-5 py-3">
                    {c.usedCount}
                    {c.usageLimit != null ? ` / ${c.usageLimit}` : ""}
                  </td>
                  <td className="px-5 py-3">
                    <Badge tone={c.active ? "success" : "danger"}>
                      {c.active ? "Active" : "Off"}
                    </Badge>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => toggleActive(c)}
                      className="text-[12px] tracking-[1px] uppercase hover:underline"
                    >
                      {c.active ? "Disable" : "Enable"}
                    </button>
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
