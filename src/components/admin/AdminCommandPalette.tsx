"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { adminFetch } from "@/lib/admin-api";
import { FiSearch } from "react-icons/fi";

type SearchHit = { id: string; href: string; name?: string; orderId?: string; status?: string; total?: number; email?: string; phone?: string; slug?: string; price?: number };

type SearchResult = {
  orders: SearchHit[];
  products: SearchHit[];
  customers: SearchHit[];
};

export function AdminCommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<SearchResult>({ orders: [], products: [], customers: [] });
  const [active, setActive] = useState(0);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(async () => {
      if (q.trim().length < 2) {
        setData({ orders: [], products: [], customers: [] });
        return;
      }
      setLoading(true);
      try {
        const res = await adminFetch<SearchResult>(
          `/api/admin/search?q=${encodeURIComponent(q.trim())}`
        );
        setData(res);
        setActive(0);
      } catch {
        setData({ orders: [], products: [], customers: [] });
      } finally {
        setLoading(false);
      }
    }, 200);
    return () => window.clearTimeout(t);
  }, [q, open]);

  const flat = useMemo(() => {
    const rows: Array<SearchHit & { kind: string }> = [];
    data.orders.forEach((r) => rows.push({ ...r, kind: "Order" }));
    data.customers.forEach((r) => rows.push({ ...r, kind: "Customer" }));
    data.products.forEach((r) => rows.push({ ...r, kind: "Product" }));
    return rows;
  }, [data]);

  const go = (href: string) => {
    setOpen(false);
    setQ("");
    router.push(href);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden lg:flex items-center gap-2 px-3 py-2 text-[12px] text-neutral-500 border border-neutral-200 rounded-lg hover:border-neutral-400 bg-white w-full max-w-xs"
      >
        <FiSearch />
        <span className="flex-1 text-left">Find an order, phone, or name</span>
        <kbd className="text-[10px] border px-1.5 py-0.5 rounded bg-neutral-50">⌘K</kbd>
      </button>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="lg:hidden p-2"
        aria-label="Search"
      >
        <FiSearch className="text-lg" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-[80]">
          <button
            type="button"
            className="absolute inset-0 bg-black/40"
            aria-label="Close search"
            onClick={() => setOpen(false)}
          />
          <div className="relative mx-auto mt-[12vh] max-w-xl w-[92%] bg-white rounded-xl shadow-2xl overflow-hidden">
            <div className="flex items-center gap-2 px-4 border-b">
              <FiSearch className="text-neutral-400" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActive((i) => Math.min(flat.length - 1, i + 1));
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActive((i) => Math.max(0, i - 1));
                  }
                  if (e.key === "Enter" && flat[active]) {
                    e.preventDefault();
                    go(flat[active]!.href);
                  }
                }}
                placeholder="Order number, phone, or name"
                className="flex-1 py-3 text-[14px] outline-none"
              />
            </div>
            <div className="max-h-[50vh] overflow-y-auto">
              {q.trim().length < 2 ? (
                <p className="p-4 text-[13px] text-neutral-400">Type at least 2 characters</p>
              ) : loading ? (
                <p className="p-4 text-[13px] text-neutral-400">Searching…</p>
              ) : flat.length === 0 ? (
                <p className="p-4 text-[13px] text-neutral-400">No matches</p>
              ) : (
                <ul>
                  {flat.map((row, i) => (
                    <li key={`${row.kind}-${row.id}`}>
                      <button
                        type="button"
                        onClick={() => go(row.href)}
                        className={`w-full text-left px-4 py-3 text-[13px] ${
                          i === active ? "bg-neutral-100" : "hover:bg-neutral-50"
                        }`}
                      >
                        <span className="text-[10px] uppercase tracking-wider text-neutral-400 mr-2">
                          {row.kind}
                        </span>
                        <span className="font-medium">
                          {row.orderId || row.name}
                        </span>
                        {row.status ? (
                          <span className="ml-2 text-neutral-500">{row.status}</span>
                        ) : null}
                        {row.phone ? (
                          <span className="ml-2 text-neutral-500">{row.phone}</span>
                        ) : null}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

export function AdminNewOrderToast() {
  const [toast, setToast] = useState<{ orderId: string; name: string } | null>(null);

  useEffect(() => {
    const key = "duti_admin_last_order_id";
    let primed = false;
    const poll = async () => {
      try {
        const data = await adminFetch<{
          orders: Array<{ orderId: string; customer?: { name?: string } }>;
        }>("/api/orders?limit=1&page=1");
        const latest = data.orders?.[0];
        if (!latest?.orderId) return;
        const prev = localStorage.getItem(key);
        if (!primed) {
          primed = true;
          if (!prev) localStorage.setItem(key, latest.orderId);
          return;
        }
        if (prev && prev !== latest.orderId) {
          localStorage.setItem(key, latest.orderId);
          setToast({ orderId: latest.orderId, name: latest.customer?.name || "" });
          window.setTimeout(() => setToast(null), 8000);
        }
      } catch {
        /* ignore */
      }
    };
    poll();
    const t = window.setInterval(poll, 25000);
    return () => window.clearInterval(t);
  }, []);

  if (!toast) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[70] bg-white border border-neutral-200 shadow-xl rounded-xl px-4 py-3 max-w-sm">
      <p className="text-[11px] uppercase tracking-wider text-neutral-400 mb-1">New order</p>
      <p className="text-[14px] font-medium">{toast.orderId}</p>
      {toast.name ? <p className="text-[13px] text-neutral-500">{toast.name}</p> : null}
      <Link
        href={`/admin/orders/${toast.orderId}`}
        className="mt-2 inline-block text-[12px] uppercase tracking-wide underline"
        onClick={() => setToast(null)}
      >
        Open
      </Link>
    </div>
  );
}
