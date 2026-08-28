"use client";

import { useEffect, useState, useCallback } from "react";

export function useToast() {
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const show = useCallback((message: string, type: "success" | "error" = "success") =>
    setToast({ message, type }), []);

  const Toast = toast ? (
    <div
      className={`fixed top-4 right-4 z-[100] px-5 py-3 text-[13px] shadow-lg rounded-lg border max-w-sm ${
        toast.type === "success"
          ? "bg-white border-emerald-200 text-emerald-800"
          : "bg-white border-red-200 text-red-700"
      }`}
    >
      {toast.message}
    </div>
  ) : null;

  return { show, Toast };
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl md:text-3xl font-serif tracking-[2px] uppercase">
          {title}
        </h1>
        {subtitle && (
          <p className="text-[13px] text-[var(--color-text-muted)] mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

export function AdminButton({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
}) {
  const styles = {
    primary: "bg-black text-white hover:bg-neutral-800",
    secondary: "border border-black bg-white hover:bg-neutral-50",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "text-neutral-600 hover:text-black hover:bg-neutral-100",
  };
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[12px] tracking-[1.5px] uppercase font-medium transition-colors disabled:opacity-50 rounded-lg ${styles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function AdminInput({
  label,
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-[12px] tracking-[1px] uppercase text-neutral-500">
      {label}
      <input
        className={`border border-[var(--color-border)] bg-white px-3 py-2.5 text-[14px] tracking-normal normal-case text-black rounded-lg outline-none focus:border-black transition-colors ${className}`}
        {...props}
      />
    </label>
  );
}

export function AdminTextarea({
  label,
  className = "",
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-[12px] tracking-[1px] uppercase text-neutral-500">
      {label}
      <textarea
        className={`border border-[var(--color-border)] bg-white px-3 py-2.5 text-[14px] tracking-normal normal-case text-black rounded-lg outline-none focus:border-black transition-colors min-h-[100px] ${className}`}
        {...props}
      />
    </label>
  );
}

export function AdminSelect({
  label,
  children,
  className = "",
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-[12px] tracking-[1px] uppercase text-neutral-500">
      {label}
      <select
        className={`border border-[var(--color-border)] bg-white px-3 py-2.5 text-[14px] tracking-normal normal-case text-black rounded-lg outline-none focus:border-black transition-colors ${className}`}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
}) {
  const tones = {
    neutral: "bg-neutral-100 text-neutral-700",
    success: "bg-emerald-50 text-emerald-800",
    warning: "bg-amber-50 text-amber-800",
    danger: "bg-red-50 text-red-700",
    info: "bg-sky-50 text-sky-800",
  };
  return (
    <span
      className={`inline-flex px-2 py-0.5 text-[11px] font-medium rounded ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="border border-dashed border-[var(--color-border)] rounded-xl bg-white px-6 py-16 text-center">
      <h3 className="text-[15px] font-medium mb-2">{title}</h3>
      {description && (
        <p className="text-[13px] text-[var(--color-text-muted)] mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <div className="bg-white border border-[var(--color-border)] rounded-xl p-5 shadow-sm">
      <p className="text-[11px] tracking-[2px] uppercase text-[var(--color-text-muted)] mb-2">
        {label}
      </p>
      <p className="text-2xl font-medium tracking-tight">{value}</p>
      {hint && (
        <p className="text-[12px] text-[var(--color-text-muted)] mt-1">{hint}</p>
      )}
    </div>
  );
}
