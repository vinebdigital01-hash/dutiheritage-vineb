"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import type { OrderDTO } from "@/lib/mappers";

type LinePick = {
  productId: string;
  name: string;
  image?: string;
  size?: string;
  color?: string;
  maxQty: number;
  quantity: number;
  selected: boolean;
};

export function ReturnRequestModal({
  isOpen,
  onClose,
  order,
  onSubmitted,
}: {
  isOpen: boolean;
  onClose: () => void;
  order: OrderDTO | null;
  onSubmitted: () => void;
}) {
  const [lines, setLines] = useState<LinePick[]>([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !order) return;
    setReason("");
    setError("");
    setLines(
      order.items.map((item) => ({
        productId: item.productId,
        name: item.name,
        image: item.image,
        size: item.size,
        color: item.color,
        maxQty: Math.max(1, item.quantity),
        quantity: Math.max(1, item.quantity),
        selected: true,
      }))
    );
  }, [isOpen, order]);

  if (!isOpen || !order) return null;

  const toggle = (idx: number) => {
    setLines((prev) =>
      prev.map((l, i) => (i === idx ? { ...l, selected: !l.selected } : l))
    );
  };

  const setQty = (idx: number, qty: number) => {
    setLines((prev) =>
      prev.map((l, i) =>
        i === idx
          ? { ...l, quantity: Math.min(l.maxQty, Math.max(1, qty)) }
          : l
      )
    );
  };

  const handleSubmit = async () => {
    const picked = lines.filter((l) => l.selected);
    if (picked.length === 0) {
      setError("Select at least one item to return.");
      return;
    }
    if (!reason.trim()) {
      setError("Please provide a reason.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { authHeaders } = await import("@/lib/checkout-client");
      const headers = await authHeaders();
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: order.orderId,
          type: "return",
          reason: reason.trim(),
          items: picked.map((l) => ({
            productId: l.productId,
            name: l.name,
            image: l.image || "",
            size: l.size || "",
            quantity: l.quantity,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not submit return");
      onSubmitted();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-[16px] font-bold text-gray-900">Request return</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4 overflow-y-auto">
          <p className="text-[13px] text-gray-600">
            Order #{order.orderId}. Pick items and quantities. Staff handle the
            reverse pickup — we do not book a courier from here.
          </p>

          <div className="flex flex-col gap-3">
            {lines.map((line, idx) => (
              <label
                key={`${line.productId}-${line.size}-${idx}`}
                className={`flex gap-3 items-start border rounded-lg p-3 cursor-pointer ${
                  line.selected ? "border-black bg-gray-50" : "border-gray-200"
                }`}
              >
                <input
                  type="checkbox"
                  checked={line.selected}
                  onChange={() => toggle(idx)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium truncate">{line.name}</p>
                  <p className="text-[12px] text-gray-500">
                    {line.size ? `Size ${line.size}` : "One size"}
                    {line.color ? ` · ${line.color}` : ""}
                    {` · Ordered ${line.maxQty}`}
                  </p>
                  {line.selected ? (
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-[11px] uppercase tracking-wider text-gray-500">
                        Qty to return
                      </span>
                      <input
                        type="number"
                        min={1}
                        max={line.maxQty}
                        value={line.quantity}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => setQty(idx, Number(e.target.value))}
                        className="w-16 border border-gray-200 rounded px-2 py-1 text-[13px]"
                      />
                    </div>
                  ) : null}
                </div>
              </label>
            ))}
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[12px] font-bold text-gray-700 uppercase tracking-wider">
              Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
              disabled={loading}
              className="w-full border border-gray-200 rounded-lg p-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-black resize-none h-24"
              placeholder="Size issue, damaged, wrong item…"
            />
          </div>

          {error ? (
            <p className="text-[13px] text-red-600 font-medium">{error}</p>
          ) : null}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 text-[13px] font-bold text-gray-600"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-5 py-2.5 text-[13px] font-bold uppercase tracking-widest rounded-lg bg-black text-white hover:bg-gray-800 disabled:bg-gray-400"
          >
            {loading ? "Submitting…" : "Submit return"}
          </button>
        </div>
      </div>
    </div>
  );
}
