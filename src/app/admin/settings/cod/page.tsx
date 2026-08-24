"use client";

import { useEffect, useState } from "react";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import {
  PageHeader,
  AdminButton,
  AdminInput,
  AdminSelect,
  AdminTextarea,
  useToast,
} from "@/components/admin/ui";
import type { CheckoutSettings } from "@/services/checkout";

export default function AdminCodSettingsPage() {
  const { show, Toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    codEnabled: true,
    codMode: "PINCODE_LIST" as CheckoutSettings["codMode"],
    codExtraCharge: "49",
    partialCodAdvance: "199",
    freeShippingAbove: "999",
    flatShippingFee: "99",
    prepaidType: "FLAT" as "FLAT" | "PERCENT",
    prepaidValue: "50",
    codPrefixes: "",
    codPincodes: "",
    codCities: "",
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await adminFetch<{ settings: CheckoutSettings }>(
          "/api/settings/cod"
        );
        const s = data.settings;
        setForm({
          codEnabled: s.codEnabled,
          codMode: s.codMode,
          codExtraCharge: String(s.codExtraCharge),
          partialCodAdvance: String(s.partialCodAdvance),
          freeShippingAbove: String(s.freeShippingAbove),
          flatShippingFee: String(s.flatShippingFee),
          prepaidType: s.prepaidDiscount.type,
          prepaidValue: String(s.prepaidDiscount.value),
          codPrefixes: (s.codPrefixes || []).join(", "),
          codPincodes: (s.codPincodes || []).join(", "),
          codCities: (s.codCities || []).join(", "),
        });
      } catch (e) {
        show(e instanceof AdminApiError ? e.message : "Load failed", "error");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const split = (s: string) =>
        s
          .split(/[\n,]+/)
          .map((x) => x.trim())
          .filter(Boolean);

      await adminFetch("/api/settings/cod", {
        method: "PUT",
        body: JSON.stringify({
          codEnabled: form.codEnabled,
          codMode: form.codMode,
          codExtraCharge: Number(form.codExtraCharge),
          partialCodAdvance: Number(form.partialCodAdvance),
          freeShippingAbove: Number(form.freeShippingAbove),
          flatShippingFee: Number(form.flatShippingFee),
          prepaidDiscount: {
            type: form.prepaidType,
            value: Number(form.prepaidValue),
          },
          codPrefixes: split(form.codPrefixes),
          codPincodes: split(form.codPincodes),
          codCities: split(form.codCities),
        }),
      });
      show("COD & shipping settings saved");
    } catch (err) {
      show(err instanceof AdminApiError ? err.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="text-[13px] text-neutral-500 animate-pulse">Loading settings…</p>
    );
  }

  return (
    <div>
      {Toast}
      <PageHeader
        title="COD & Shipping"
        subtitle="Controls checkout payment options and free shipping threshold"
      />

      <form
        onSubmit={save}
        className="bg-white border border-[var(--color-border)] rounded-xl p-5 md:p-8 shadow-sm space-y-8 max-w-3xl"
      >
        <label className="flex items-center gap-3 text-[14px] cursor-pointer">
          <input
            type="checkbox"
            checked={form.codEnabled}
            onChange={(e) =>
              setForm((f) => ({ ...f, codEnabled: e.target.checked }))
            }
            className="accent-black w-4 h-4"
          />
          Enable Cash on Delivery
        </label>

        <AdminSelect
          label="COD availability mode"
          value={form.codMode}
          onChange={(e) =>
            setForm((f) => ({
              ...f,
              codMode: e.target.value as CheckoutSettings["codMode"],
            }))
          }
        >
          <option value="ALL_INDIA">All India</option>
          <option value="PINCODE_LIST">Pincode / prefix list</option>
          <option value="CITY_LIST">City list</option>
        </AdminSelect>

        <div className="grid md:grid-cols-2 gap-5">
          <AdminInput
            label="COD extra charge (₹)"
            type="number"
            value={form.codExtraCharge}
            onChange={(e) =>
              setForm((f) => ({ ...f, codExtraCharge: e.target.value }))
            }
          />
          <AdminInput
            label="Partial COD advance (₹)"
            type="number"
            value={form.partialCodAdvance}
            onChange={(e) =>
              setForm((f) => ({ ...f, partialCodAdvance: e.target.value }))
            }
          />
          <AdminInput
            label="Free shipping above (₹)"
            type="number"
            value={form.freeShippingAbove}
            onChange={(e) =>
              setForm((f) => ({ ...f, freeShippingAbove: e.target.value }))
            }
          />
          <AdminInput
            label="Flat shipping fee (₹)"
            type="number"
            value={form.flatShippingFee}
            onChange={(e) =>
              setForm((f) => ({ ...f, flatShippingFee: e.target.value }))
            }
          />
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          <AdminSelect
            label="Prepaid discount type"
            value={form.prepaidType}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                prepaidType: e.target.value as "FLAT" | "PERCENT",
              }))
            }
          >
            <option value="FLAT">Flat ₹</option>
            <option value="PERCENT">Percent %</option>
          </AdminSelect>
          <AdminInput
            label="Prepaid discount value"
            type="number"
            value={form.prepaidValue}
            onChange={(e) =>
              setForm((f) => ({ ...f, prepaidValue: e.target.value }))
            }
          />
        </div>

        <AdminTextarea
          label="COD prefixes (comma or newline) — e.g. 1100, 4000"
          value={form.codPrefixes}
          onChange={(e) =>
            setForm((f) => ({ ...f, codPrefixes: e.target.value }))
          }
        />
        <AdminTextarea
          label="Exact COD pincodes (optional)"
          value={form.codPincodes}
          onChange={(e) =>
            setForm((f) => ({ ...f, codPincodes: e.target.value }))
          }
        />
        <AdminTextarea
          label="COD cities (for CITY_LIST mode)"
          value={form.codCities}
          onChange={(e) =>
            setForm((f) => ({ ...f, codCities: e.target.value }))
          }
        />

        <AdminButton type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save settings"}
        </AdminButton>
      </form>
    </div>
  );
}
