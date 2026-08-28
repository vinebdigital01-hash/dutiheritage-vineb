"use client";
import { useState } from "react";
import { markLogAsFixed } from "./actions";
import { FiCheck } from "react-icons/fi";

export function MarkFixedButton({ logId, initialStatus }: { logId: string, initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus || "open");
  const [loading, setLoading] = useState(false);

  if (status === "fixed") {
    return (
      <span className="text-green-600 font-bold text-[10px] uppercase tracking-wider flex items-center gap-1">
        <FiCheck /> Fixed
      </span>
    );
  }

  return (
    <button
      onClick={async () => {
        setLoading(true);
        try {
          await markLogAsFixed(logId);
          setStatus("fixed");
        } catch (err) {
          console.error(err);
        }
        setLoading(false);
      }}
      disabled={loading}
      className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors disabled:opacity-50"
    >
      {loading ? "..." : "Mark Fixed"}
    </button>
  );
}
