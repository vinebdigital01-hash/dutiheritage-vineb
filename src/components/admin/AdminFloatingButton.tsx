"use client";

import Link from "next/link";
import { useAppContext } from "@/context/AppContext";

/** Floating entry to /admin — only for admins on the storefront. */
export function AdminFloatingButton() {
  const { isAdmin, authLoading, user } = useAppContext();

  if (authLoading || !user || !isAdmin) return null;

  return (
    <Link
      href="/admin"
      className="fixed bottom-6 right-6 z-[60] group flex items-center gap-2 bg-black text-white pl-4 pr-5 py-3 rounded-full shadow-xl hover:bg-neutral-800 transition-all hover:scale-[1.02]"
      aria-label="Open admin panel"
    >
      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
      <span className="text-[12px] tracking-[1.5px] uppercase font-medium">
        Admin
      </span>
    </Link>
  );
}
