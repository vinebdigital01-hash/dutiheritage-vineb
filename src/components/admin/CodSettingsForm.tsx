"use client";

import { useEffect, useState } from "react";
import { adminFetch, AdminApiError } from "@/lib/admin-api";
import {
  AdminButton,
  AdminInput,
  AdminSelect,
  AdminTextarea,
  useToast,
} from "@/components/admin/ui";
import { useConfirm } from "@/components/ConfirmDialog";
import type { CheckoutSettings, StateShippingRate } from "@/services/checkout";
import { ALL_INDIAN_STATES } from "@/lib/pincode-lookup";

const RECOMMENDED_PRESETS: StateShippingRate[] = [
  {
    name: "Delhi NCR & Local",
    states: ["Delhi", "Haryana"],
    cities: [],
    flatShippingFee: 49,
    freeShippingAbove: 499,
  },
  {
    name: "Northern & Central India",
    states: ["Uttar Pradesh", "Punjab", "Rajasthan", "Chandigarh"],
    cities: [],
    flatShippingFee: 79,
    freeShippingAbove: 799,
  },
  {
    name: "Southern India",
    states: [
      "Tamil Nadu",
      "Kerala",
      "Karnataka",
      "Telangana",
      "Andhra Pradesh",
    ],
    cities: [],
    flatShippingFee: 119,
    freeShippingAbove: 1199,
  },
  {
    name: "Northeast & Remote",
    states: [
      "Assam",
      "Meghalaya",
      "Manipur",
      "Mizoram",
      "Nagaland",
      "Tripura",
      "Arunachal Pradesh",
      "Sikkim",
    ],
    cities: [],
    flatShippingFee: 149,
    freeShippingAbove: 1499,
  },
];

export function CodSettingsForm({ embedded = false }: { embedded?: boolean }) {
  const { show, Toast } = useToast();
  const { confirm, ConfirmDialog } = useConfirm();
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

  const [stateShippingRates, setStateShippingRates] = useState<StateShippingRate[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editRateForm, setEditRateForm] = useState<{
    name: string;
    states: string[];
    cities: string;
    flatShippingFee: string;
    freeShippingAbove: string;
  }>({
    name: "",
    states: [],
    cities: "",
    flatShippingFee: "49",
    freeShippingAbove: "499",
  });

  useEffect(() => {
    (async () => {
      try {
        const data = await adminFetch<{ settings: CheckoutSettings }>("/api/settings/cod");
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
        setStateShippingRates(s.stateShippingRates || []);
      } catch (e) {
        show(e instanceof AdminApiError ? e.message : "Load failed", "error");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openNewRate = () => {
    setEditingIndex(-1);
    setEditRateForm({
      name: "",
      states: [],
      cities: "",
      flatShippingFee: "69",
      freeShippingAbove: "699",
    });
  };

  const openEditRate = (index: number) => {
    const rate = stateShippingRates[index];
    setEditingIndex(index);
    setEditRateForm({
      name: rate.name,
      states: [...rate.states],
      cities: (rate.cities || []).join(", "),
      flatShippingFee: String(rate.flatShippingFee),
      freeShippingAbove: String(rate.freeShippingAbove),
    });
  };

  const deleteRate = async (index: number) => {
    const rate = stateShippingRates[index];
    if (
      !(await confirm({
        title: "Delete Rate Rule",
        description: `Are you sure you want to delete shipping rule "${rate.name}"?`,
        confirmText: "Delete",
      }))
    )
      return;

    setStateShippingRates((prev) => prev.filter((_, i) => i !== index));
    if (editingIndex === index) setEditingIndex(null);
  };

  const handleSaveRateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editRateForm.name.trim()) {
      show("Please enter a name for this rate rule (e.g. Delhi NCR)", "error");
      return;
    }
    if (editRateForm.states.length === 0) {
      show("Please select at least one State", "error");
      return;
    }

    const newRate: StateShippingRate = {
      name: editRateForm.name.trim(),
      states: editRateForm.states,
      cities: editRateForm.cities
        .split(/[\n,]+/)
        .map((c) => c.trim())
        .filter(Boolean),
      flatShippingFee: Number(editRateForm.flatShippingFee) || 0,
      freeShippingAbove: Number(editRateForm.freeShippingAbove) || 0,
    };

    if (editingIndex === -1 || editingIndex === null) {
      setStateShippingRates((prev) => [...prev, newRate]);
    } else {
      setStateShippingRates((prev) =>
        prev.map((r, i) => (i === editingIndex ? newRate : r))
      );
    }

    setEditingIndex(null);
    show("Shipping rate rule added. Remember to save settings below.");
  };

  const toggleStateInEdit = (st: string) => {
    setEditRateForm((prev) => {
      const exists = prev.states.includes(st);
      return {
        ...prev,
        states: exists ? prev.states.filter((s) => s !== st) : [...prev.states, st],
      };
    });
  };

  const loadRecommendedPresets = async () => {
    if (
      !(await confirm({
        title: "Load Recommended Presets",
        description:
          "This will add standard Indian regional presets (Delhi NCR, North, South, Northeast). Any existing rules will be replaced. Continue?",
        confirmText: "Load Presets",
      }))
    )
      return;

    setStateShippingRates(RECOMMENDED_PRESETS);
    show("Loaded recommended shipping presets. Click 'Save COD & shipping' to apply.");
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !(await confirm({
        title: "Save settings",
        description: "Save COD & state shipping settings?",
        confirmText: "Save",
      }))
    )
      return;
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
          stateShippingRates,
        }),
      });
      show("COD & shipping settings saved successfully");
    } catch (err) {
      show(err instanceof AdminApiError ? err.message : "Save failed", "error");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <p className="text-[13px] text-neutral-500 animate-pulse">
        Loading COD settings…
      </p>
    );
  }

  return (
    <div>
      {!embedded && Toast}
      {ConfirmDialog}
      {embedded && Toast}
      <form
        onSubmit={save}
        className="bg-white border border-[var(--color-border)] rounded-xl p-5 md:p-8 shadow-sm space-y-8 max-w-4xl"
      >
        <div className="border-b border-neutral-100 pb-5">
          <h2 className="text-base font-serif uppercase tracking-[1px] text-neutral-900">
            Cash On Delivery (COD) Rules
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            Configure COD payment availability, pincode whitelist, and surcharge.
          </p>
        </div>

        <label className="flex items-center gap-3 text-[14px] cursor-pointer">
          <input
            type="checkbox"
            checked={form.codEnabled}
            onChange={(e) =>
              setForm((f) => ({ ...f, codEnabled: e.target.checked }))
            }
            className="accent-black w-4 h-4"
          />
          <span className="font-medium text-neutral-800">
            Enable Cash on Delivery (COD)
          </span>
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

        <div className="border-t border-neutral-100 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-serif uppercase tracking-[1px] text-neutral-900">
                Default All-India Shipping
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Applies when customer address does not match any custom state rules below.
              </p>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <AdminInput
              label="Default flat shipping fee (₹)"
              type="number"
              value={form.flatShippingFee}
              onChange={(e) =>
                setForm((f) => ({ ...f, flatShippingFee: e.target.value }))
              }
            />
            <AdminInput
              label="Default free shipping above (₹)"
              type="number"
              value={form.freeShippingAbove}
              onChange={(e) =>
                setForm((f) => ({ ...f, freeShippingAbove: e.target.value }))
              }
            />
          </div>
        </div>

        {/* State-Wise & City-Wise Shipping Charges */}
        <div className="border-t border-neutral-100 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h2 className="text-base font-serif uppercase tracking-[1px] text-neutral-900">
                State & City Specific Shipping Rates
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                Configure regional delivery charges (e.g. Delhi NCR at ₹49/free &gt; ₹499; Assam/Tamil Nadu at ₹149/free &gt; ₹1499). Automatically detected from customer PIN code!
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={loadRecommendedPresets}
                className="px-3 py-1.5 text-xs text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
              >
                Load Presets
              </button>
              <button
                type="button"
                onClick={openNewRate}
                className="px-3 py-1.5 text-xs font-medium text-white bg-black hover:bg-neutral-800 rounded-lg transition-colors flex items-center gap-1"
              >
                + Add State Rule
              </button>
            </div>
          </div>

          {/* List of active rules */}
          {stateShippingRates.length === 0 ? (
            <div className="text-center py-8 bg-neutral-50 border border-dashed border-neutral-200 rounded-xl">
              <p className="text-xs text-neutral-500">
                No custom state shipping rates configured. Default all-India rates apply.
              </p>
              <button
                type="button"
                onClick={openNewRate}
                className="mt-2 text-xs text-black font-semibold underline hover:no-underline"
              >
                Create your first regional shipping rule
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {stateShippingRates.map((rate, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-neutral-900">
                        {rate.name}
                      </span>
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        ₹{rate.flatShippingFee} Fee • Free above ₹{rate.freeShippingAbove}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 items-center">
                      <span className="text-[11px] text-neutral-500 mr-1">States:</span>
                      {rate.states.map((st) => (
                        <span
                          key={st}
                          className="px-2 py-0.5 text-[11px] rounded bg-white border border-neutral-200 text-neutral-700"
                        >
                          {st}
                        </span>
                      ))}
                      {rate.cities && rate.cities.length > 0 && (
                        <span className="text-[11px] text-neutral-500 ml-2">
                          (Specific Cities: {rate.cities.join(", ")})
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditRate(index)}
                      className="px-2.5 py-1 text-xs font-medium text-neutral-700 bg-white border border-neutral-200 hover:bg-neutral-100 rounded-md transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteRate(index)}
                      className="px-2.5 py-1 text-xs font-medium text-red-600 bg-red-50 border border-red-200 hover:bg-red-100 rounded-md transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Modal / Inline form to add or edit rate */}
          {editingIndex !== null && (
            <div className="mt-4 p-5 rounded-xl border-2 border-neutral-300 bg-white shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-neutral-900">
                  {editingIndex === -1 ? "Add State Shipping Rule" : "Edit State Shipping Rule"}
                </h3>
                <button
                  type="button"
                  onClick={() => setEditingIndex(null)}
                  className="text-xs text-neutral-400 hover:text-neutral-700"
                >
                  ✕ Cancel
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <AdminInput
                  label="Rule Name (e.g. Delhi NCR)"
                  value={editRateForm.name}
                  onChange={(e) =>
                    setEditRateForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Delhi & Haryana Local"
                  required
                />
                <AdminInput
                  label="Shipping Fee (₹)"
                  type="number"
                  value={editRateForm.flatShippingFee}
                  onChange={(e) =>
                    setEditRateForm((f) => ({ ...f, flatShippingFee: e.target.value }))
                  }
                  required
                />
                <AdminInput
                  label="Free Shipping Above (₹)"
                  type="number"
                  value={editRateForm.freeShippingAbove}
                  onChange={(e) =>
                    setEditRateForm((f) => ({
                      ...f,
                      freeShippingAbove: e.target.value,
                    }))
                  }
                  required
                />
              </div>

              <div>
                <label className="text-[12px] tracking-[1px] uppercase text-neutral-500 font-medium block mb-1.5">
                  Select Covered States ({editRateForm.states.length} selected)
                </label>
                <div className="max-h-48 overflow-y-auto p-3 bg-neutral-50 rounded-lg border border-neutral-200 grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {ALL_INDIAN_STATES.map((stateName) => {
                    const checked = editRateForm.states.includes(stateName);
                    return (
                      <label
                        key={stateName}
                        className={`flex items-center gap-2 p-1.5 rounded cursor-pointer text-xs transition-colors ${
                          checked
                            ? "bg-black text-white font-medium"
                            : "hover:bg-neutral-200/60 text-neutral-700"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleStateInEdit(stateName)}
                          className="sr-only"
                        />
                        <span className="truncate">{stateName}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <AdminInput
                label="Specific Cities (Optional, comma-separated)"
                value={editRateForm.cities}
                onChange={(e) =>
                  setEditRateForm((f) => ({ ...f, cities: e.target.value }))
                }
                placeholder="Leave blank for entire state, or e.g. Gurugram, Faridabad"
              />

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingIndex(null)}
                  className="px-3 py-1.5 text-xs text-neutral-600 bg-neutral-100 hover:bg-neutral-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveRateRule}
                  className="px-4 py-1.5 text-xs font-medium text-white bg-black hover:bg-neutral-800 rounded-lg"
                >
                  {editingIndex === -1 ? "Add Rule" : "Update Rule"}
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-neutral-100 pt-6 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Advanced Pincode & City Filters
          </h3>
          <AdminTextarea
            label="COD prefixes (comma or newline) — e.g. 1100, 4000"
            value={form.codPrefixes}
            onChange={(e) => setForm((f) => ({ ...f, codPrefixes: e.target.value }))}
          />
          <AdminTextarea
            label="Exact COD pincodes (optional)"
            value={form.codPincodes}
            onChange={(e) => setForm((f) => ({ ...f, codPincodes: e.target.value }))}
          />
          <AdminTextarea
            label="COD cities (for CITY_LIST mode)"
            value={form.codCities}
            onChange={(e) => setForm((f) => ({ ...f, codCities: e.target.value }))}
          />
        </div>

        <AdminButton type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save COD & shipping"}
        </AdminButton>
      </form>
    </div>
  );
}
