"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { X } from "lucide-react";

type ConfirmStyle = "danger" | "primary";

type ConfirmOpts = {
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  confirmStyle?: ConfirmStyle;
};

type PromptOpts = {
  title: string;
  description?: string;
  label?: string;
  defaultValue?: string;
  placeholder?: string;
  confirmText?: string;
  confirmStyle?: ConfirmStyle;
};

function Shell({
  title,
  children,
  onClose,
  loading,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-[16px] font-bold text-gray-900">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmStyle = "primary",
}: ConfirmOpts & {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleConfirm = async () => {
    setError("");
    setLoading(true);
    try {
      await onConfirm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  return (
    <Shell title={title} onClose={onClose} loading={loading}>
      <div className="p-5">
        {description ? (
          <p className="text-[14px] text-gray-600 leading-relaxed">{description}</p>
        ) : null}
        {error ? <p className="mt-3 text-[13px] text-red-600 font-medium">{error}</p> : null}
      </div>
      <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-5 py-2.5 text-[13px] font-bold text-gray-600 hover:text-gray-900"
        >
          {cancelText}
        </button>
        <button
          type="button"
          onClick={() => void handleConfirm()}
          disabled={loading}
          className={`px-5 py-2.5 text-[13px] font-bold uppercase tracking-widest rounded-lg min-w-[120px] ${
            confirmStyle === "danger"
              ? "bg-red-600 hover:bg-red-700 text-white disabled:bg-red-400"
              : "bg-black hover:bg-gray-800 text-white disabled:bg-gray-400"
          }`}
        >
          {loading ? "…" : confirmText}
        </button>
      </div>
    </Shell>
  );
}

export function PromptModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  label = "Value",
  defaultValue = "",
  placeholder,
  confirmText = "Continue",
  confirmStyle = "primary",
}: PromptOpts & {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (value: string) => void | Promise<void>;
}) {
  const [value, setValue] = useState(defaultValue);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setValue(defaultValue);
      setError("");
      setLoading(false);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    if (!value.trim()) {
      setError("Please enter a value.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await onConfirm(value.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  return (
    <Shell title={title} onClose={onClose} loading={loading}>
      <div className="p-5 flex flex-col gap-3">
        {description ? (
          <p className="text-[14px] text-gray-600 leading-relaxed">{description}</p>
        ) : null}
        <label className="text-[12px] font-bold text-gray-700 uppercase tracking-wider">
          {label}
        </label>
        <input
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            if (error) setError("");
          }}
          placeholder={placeholder}
          disabled={loading}
          className="w-full border border-gray-200 rounded-lg p-3 text-[14px] outline-none focus:ring-2 focus:ring-black"
          onKeyDown={(e) => {
            if (e.key === "Enter") void handleConfirm();
          }}
        />
        {error ? <p className="text-[13px] text-red-600 font-medium">{error}</p> : null}
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
          onClick={() => void handleConfirm()}
          disabled={loading}
          className={`px-5 py-2.5 text-[13px] font-bold uppercase tracking-widest rounded-lg min-w-[120px] ${
            confirmStyle === "danger"
              ? "bg-red-600 text-white"
              : "bg-black text-white"
          }`}
        >
          {loading ? "…" : confirmText}
        </button>
      </div>
    </Shell>
  );
}

/** Promise-based confirm — drop-in for window.confirm */
export function useConfirm() {
  const [state, setState] = useState<(ConfirmOpts & { resolve: (ok: boolean) => void }) | null>(
    null
  );

  const confirm = useCallback((opts: ConfirmOpts) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...opts, resolve });
    });
  }, []);

  const dialog = state ? (
    <ConfirmModal
      isOpen
      title={state.title}
      description={state.description}
      confirmText={state.confirmText}
      cancelText={state.cancelText}
      confirmStyle={state.confirmStyle}
      onClose={() => {
        state.resolve(false);
        setState(null);
      }}
      onConfirm={() => {
        state.resolve(true);
        setState(null);
      }}
    />
  ) : null;

  return { confirm, ConfirmDialog: dialog };
}

/** Promise-based prompt — drop-in for window.prompt (null = cancelled) */
export function usePrompt() {
  const [state, setState] = useState<
    (PromptOpts & { resolve: (value: string | null) => void }) | null
  >(null);

  const prompt = useCallback((opts: PromptOpts) => {
    return new Promise<string | null>((resolve) => {
      setState({ ...opts, resolve });
    });
  }, []);

  const dialog = state ? (
    <PromptModal
      isOpen
      title={state.title}
      description={state.description}
      label={state.label}
      defaultValue={state.defaultValue}
      placeholder={state.placeholder}
      confirmText={state.confirmText}
      confirmStyle={state.confirmStyle}
      onClose={() => {
        state.resolve(null);
        setState(null);
      }}
      onConfirm={(value) => {
        state.resolve(value);
        setState(null);
      }}
    />
  ) : null;

  return { prompt, PromptDialog: dialog };
}
