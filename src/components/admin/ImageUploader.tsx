"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { FiUpload, FiX, FiLoader } from "react-icons/fi";
import {
  compressImageForUpload,
  formatBytes,
} from "@/lib/image-compress";
import { authHeaders } from "@/lib/checkout-client";

type Props = {
  label?: string;
  value?: string;
  onChange: (url: string) => void;
  /** When true, appends to gallery list via onAdd instead of replacing */
  multiple?: boolean;
  onAdd?: (url: string) => void;
  folder?: string;
};

export function ImageUploader({
  label = "Upload image",
  value,
  onChange,
  multiple,
  onAdd,
  folder = "dutiheritage/products",
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const processFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    setBusy(true);

    try {
      const list = Array.from(files);
      for (let i = 0; i < list.length; i++) {
        const raw = list[i]!;
        setProgress(
          `Compressing ${i + 1}/${list.length} (high quality)…`
        );

        const compressed = await compressImageForUpload(raw, (pct) => {
          setProgress(
            `Compressing ${i + 1}/${list.length}… ${pct}%`
          );
        });

        setLastSaved(
          compressed.savedPercent > 0
            ? `Saved ${compressed.savedPercent}% (${formatBytes(compressed.originalBytes)} → ${formatBytes(compressed.compressedBytes)}) without soft blur`
            : `Already optimized (${formatBytes(compressed.originalBytes)})`
        );

        setProgress(`Uploading ${i + 1}/${list.length}…`);

        const headers = await authHeaders();
        const authHeader =
          typeof headers === "object" &&
          headers !== null &&
          "Authorization" in headers
            ? String((headers as Record<string, string>).Authorization || "")
            : "";

        const body = new FormData();
        body.append("file", compressed.file);
        body.append("folder", folder);

        const res = await fetch("/api/upload", {
          method: "POST",
          headers: authHeader ? { Authorization: authHeader } : {},
          body,
        });

        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || "Upload failed");
        }

        if (multiple && onAdd) {
          onAdd(data.url);
        } else {
          onChange(data.url);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {label && (
        <p className="text-[12px] tracking-[1px] uppercase text-neutral-500">
          {label}
        </p>
      )}

      <div className="flex flex-wrap gap-4 items-start">
        {value && !multiple && (
          <div className="relative w-28 h-28 rounded-xl overflow-hidden border border-[var(--color-border)] bg-neutral-100">
            <Image src={value} alt="Preview" fill className="object-cover" sizes="112px" unoptimized={value.startsWith("http") === false} />
            <button
              type="button"
              onClick={() => onChange("")}
              className="absolute top-1 right-1 bg-black/70 text-white p-1 rounded"
              aria-label="Remove"
            >
              <FiX className="text-sm" />
            </button>
          </div>
        )}

        <button
          type="button"
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 w-full sm:w-56 h-28 border border-dashed border-neutral-300 rounded-xl bg-neutral-50 hover:border-black hover:bg-white transition-colors disabled:opacity-60"
        >
          {busy ? (
            <FiLoader className="animate-spin text-xl" />
          ) : (
            <FiUpload className="text-xl" />
          )}
          <span className="text-[12px] tracking-[1px] uppercase font-medium px-3 text-center">
            {busy ? progress || "Working…" : multiple ? "Add images" : "Upload image"}
          </span>
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/jpg"
          multiple={multiple}
          className="hidden"
          onChange={(e) => processFiles(e.target.files)}
        />
      </div>

      <p className="text-[11px] text-neutral-400 leading-relaxed">
        Images are compressed in your browser first (max ~2000px, quality ~90%) so
        uploads stay light without soft / blurry product photos.
      </p>

      {lastSaved && (
        <p className="text-[12px] text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-2 rounded-lg">
          {lastSaved}
        </p>
      )}
      {error && (
        <p className="text-[12px] text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
          {error}
        </p>
      )}
    </div>
  );
}
