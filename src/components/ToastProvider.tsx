"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type ToastType = "success" | "error" | "info";

type ToastState = { message: string; type: ToastType } | null;

type ToastContextValue = {
  show: (message: string, type?: ToastType) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3500);
    return () => window.clearTimeout(t);
  }, [toast]);

  const show = useCallback((message: string, type: ToastType = "success") => {
    setToast({ message, type });
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {toast ? (
        <div
          role="status"
          className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-[120] px-5 py-3 text-[13px] shadow-lg rounded-lg border max-w-[min(92vw,420px)] text-center ${
            toast.type === "error"
              ? "bg-white border-red-200 text-red-700"
              : toast.type === "info"
                ? "bg-white border-neutral-200 text-neutral-800"
                : "bg-white border-emerald-200 text-emerald-800"
          }`}
        >
          {toast.message}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useStoreToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      show: (message: string) => {
        console.info("[toast]", message);
      },
    };
  }
  return ctx;
}
