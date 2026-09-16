"use client";

import { useState } from "react";
import { X } from "lucide-react";

type ActionModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void>;
  title: string;
  description?: string;
  requireReason?: boolean;
  reasonLabel?: string;
  confirmText?: string;
  confirmStyle?: "danger" | "primary";
};

export function ActionModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  requireReason = true,
  reasonLabel = "Reason",
  confirmText = "Confirm",
  confirmStyle = "primary",
}: ActionModalProps) {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (requireReason && !reason.trim()) {
      setError("Please provide a reason.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onConfirm(reason.trim());
      onClose();
      setReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-[16px] font-bold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="p-5 flex flex-col gap-4">
          {description && <p className="text-[14px] text-gray-600">{description}</p>}
          
          {requireReason && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[12px] font-bold text-gray-700 uppercase tracking-wider">
                {reasonLabel}
              </label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (error) setError("");
                }}
                disabled={loading}
                className="w-full border border-gray-200 rounded-lg p-3 text-[14px] focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent resize-none h-24"
                placeholder="Type here..."
              />
            </div>
          )}

          {error && <p className="text-[13px] text-red-600 font-medium">{error}</p>}
        </div>

        <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-5 py-2.5 text-[13px] font-bold text-gray-600 hover:text-gray-900 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`px-5 py-2.5 text-[13px] font-bold uppercase tracking-widest rounded-lg transition-colors flex items-center justify-center min-w-[120px] ${confirmStyle === "danger" ? "bg-red-600 hover:bg-red-700 text-white disabled:bg-red-400" : "bg-black hover:bg-gray-800 text-white disabled:bg-gray-400"}`}
          >
            {loading ? "Processing..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
