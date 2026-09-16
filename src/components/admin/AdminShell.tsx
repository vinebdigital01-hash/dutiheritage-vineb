"use client";
import { SkeletonPage } from "@/components/ui/Skeleton";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppContext } from "@/context/AppContext";
import {
  FiBox,
  FiGrid,
  FiHome,
  FiLogOut,
  FiMenu,
  FiPackage,
  FiSettings,
  FiTag,
  FiX,
  FiExternalLink,
  FiEdit3,
  FiMessageSquare,
  FiZap,
  FiUsers,
  FiBarChart2,
  FiFileText,
  FiLayers,
  FiShield,
  FiActivity,
  FiMessageCircle,
  FiAlertCircle,
  FiClipboard,
  FiRotateCcw,
} from "react-icons/fi";
import { ADMIN_NAV, ADMIN_IDLE_MS, canRoleAccessPath, defaultAdminPath, NAV_SECTIONS } from "@/lib/rbac";
import { AdminCommandPalette, AdminNewOrderToast } from "@/components/admin/AdminCommandPalette";
import { AdminHowTo } from "@/components/admin/AdminHowTo";
import type { StaffRole } from "@/models/Staff";
import type { IconType } from "react-icons";

const ICONS: Record<string, IconType> = {
  "/admin": FiHome,
  "/admin/orders": FiPackage,
  "/admin/returns": FiRotateCcw,
  "/admin/inventory": FiAlertCircle,
  "/admin/customers": FiUsers,
  "/admin/reviews": FiMessageSquare,
  "/admin/whatsapp": FiMessageCircle,
  "/admin/products": FiBox,
  "/admin/collections": FiGrid,
  "/admin/analytics": FiBarChart2,
  "/admin/reports": FiFileText,
  "/admin/groups": FiLayers,
  "/admin/coupons": FiTag,
  "/admin/automations": FiZap,
  "/admin/content": FiEdit3,
  "/admin/settings": FiSettings,
  "/admin/audit": FiClipboard,
  "/admin/staff": FiShield,
  "/admin/logs": FiActivity,
};

const LABELS: Record<string, string> = {
  "/admin": "Home",
  "/admin/orders": "Orders",
  "/admin/returns": "Returns",
  "/admin/inventory": "Stock",
  "/admin/customers": "Customers",
  "/admin/reviews": "Reviews",
  "/admin/whatsapp": "WhatsApp chats",
  "/admin/products": "Products",
  "/admin/collections": "Collections",
  "/admin/analytics": "Sales charts",
  "/admin/reports": "Email reports",
  "/admin/groups": "Customer lists",
  "/admin/coupons": "Discount codes",
  "/admin/automations": "Auto messages",
  "/admin/content": "Homepage",
  "/admin/settings": "Store settings",
  "/admin/audit": "Who changed what",
  "/admin/staff": "Staff",
  "/admin/logs": "Error log",
};

const IDLE_KEY = "duti_admin_last_active";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, adminRole, authLoading, logout } = useAppContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [denied, setDenied] = useState(false);
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (isLogin || authLoading) return;
    if (!user) {
      router.replace(`/admin/login?next=${encodeURIComponent(pathname || "/admin")}`);
      return;
    }
    if (!isAdmin) {
      setDenied(true);
      return;
    }
    if (!canRoleAccessPath(adminRole, pathname || "/admin")) {
      router.replace(defaultAdminPath(adminRole));
    }
  }, [authLoading, user, isAdmin, adminRole, router, pathname, isLogin]);

  useEffect(() => {
    if (isLogin || !user || !isAdmin) return;
    const bump = () => {
      try {
        localStorage.setItem(IDLE_KEY, String(Date.now()));
      } catch {
        /* ignore */
      }
    };
    bump();
    const events: Array<keyof WindowEventMap> = ["click", "keydown", "mousemove", "scroll"];
    events.forEach((ev) => window.addEventListener(ev, bump, { passive: true }));
    const t = window.setInterval(() => {
      try {
        const last = Number(localStorage.getItem(IDLE_KEY) || "0");
        if (last && Date.now() - last > ADMIN_IDLE_MS) {
          logout("/admin/login?timeout=1");
        }
      } catch {
        /* ignore */
      }
    }, 15000);
    return () => {
      events.forEach((ev) => window.removeEventListener(ev, bump));
      window.clearInterval(t);
    };
  }, [isLogin, user, isAdmin, logout]);

  if (isLogin) {
    return <div className="admin-shell">{children}</div>;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen p-8">
        <SkeletonPage />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <p className="text-[13px] tracking-[2px] uppercase text-[var(--color-text-muted)]">
          Redirecting to staff login…
        </p>
      </div>
    );
  }

  if (denied || !isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-6 bg-[var(--color-bg)] text-center">
        <p className="text-[11px] tracking-[3px] uppercase text-[var(--color-text-muted)] mb-3">
          Restricted
        </p>
        <h1 className="text-2xl font-serif tracking-[2px] uppercase mb-4">
          Admin access required
        </h1>
        <p className="text-[14px] text-[var(--color-text-muted)] mb-8 max-w-md">
          Signed in as <span className="text-black font-medium">{user.email}</span>. This account is
          not authorized for the admin dashboard.
        </p>
        <div className="flex gap-3">
          <Link
            href="/"
            className="border border-black px-6 py-3 text-[12px] tracking-[2px] uppercase hover:bg-black hover:text-white transition-colors"
          >
            Back to store
          </Link>
          <button
            type="button"
            onClick={() => logout("/admin/login")}
            className="bg-black text-white px-6 py-3 text-[12px] tracking-[2px] uppercase hover:bg-black/90"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => {
    const allowedNav = ADMIN_NAV.filter(
      (item) => adminRole && item.roles.includes(adminRole as StaffRole)
    );

    return (
      <nav className="flex flex-col gap-4 px-3">
        {NAV_SECTIONS.map((section) => {
          const items = allowedNav.filter((item) => item.section === section.id);
          if (!items.length) return null;
          return (
            <div key={section.id}>
              <p className="px-3 mb-1 text-[10px] font-semibold tracking-[1px] uppercase text-neutral-400">
                {section.label}
              </p>
              <div className="flex flex-col gap-0.5">
                {items.map((item) => {
                  const active = item.exact
                    ? pathname === item.href
                    : pathname === item.href || pathname?.startsWith(item.href + "/");
                  const Icon = ICONS[item.href] || FiHome;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={`flex items-center gap-3 px-3 py-2 text-[13px] transition-colors rounded-lg ${
                        active
                          ? "bg-black text-white"
                          : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
                      }`}
                    >
                      <Icon className="text-[16px] shrink-0" />
                      {LABELS[item.href] || item.href}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>
    );
  };

  return (
    <div className="admin-shell min-h-screen bg-[#fafafa] text-black flex">
      <aside className="hidden lg:flex w-[260px] shrink-0 flex-col border-r border-[var(--color-border)] bg-white print:hidden sticky top-0 h-screen self-start overflow-hidden">
        <div className="px-6 py-6 border-b border-[var(--color-border)]">
          <p className="text-[10px] tracking-[3px] uppercase text-[var(--color-text-muted)] mb-1">
            Duti Heritage
          </p>
          <h1 className="text-lg font-serif tracking-[2px] uppercase">Admin</h1>
          <p className="text-[11px] text-neutral-500 mt-1 leading-snug">Run the shop: orders, stock, customers</p>
        </div>
        <div className="flex-1 py-4 overflow-y-auto">
          <NavLinks />
        </div>
        <div className="p-4 border-t border-[var(--color-border)] space-y-2">
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-[12px] text-neutral-600 hover:text-black"
          >
            <FiExternalLink /> View store
          </Link>
          <button
            type="button"
            onClick={() => logout("/admin/login")}
            className="flex items-center gap-2 px-3 py-2 text-[12px] text-neutral-600 hover:text-black w-full text-left"
          >
            <FiLogOut /> Sign out
          </button>
          <div className="px-3 flex flex-col gap-0.5">
            <span className="text-[11px] text-neutral-400 truncate">{user.email}</span>
            {adminRole && (
              <span className="text-[9px] font-bold tracking-[1px] uppercase text-black bg-neutral-200 w-fit px-1.5 py-0.5 rounded">
                {adminRole}
              </span>
            )}
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 flex items-center gap-3 px-4 py-3 bg-white border-b border-[var(--color-border)] print:hidden">
          <button type="button" onClick={() => setMobileOpen(true)} className="p-2 -ml-2 lg:hidden" aria-label="Open menu">
            <FiMenu className="text-xl" />
          </button>
          <div className="flex-1 min-w-0">
            <AdminCommandPalette />
          </div>
          <Link href="/" className="lg:hidden text-[11px] tracking-[1px] uppercase text-neutral-500">
            Store
          </Link>
        </header>

        {mobileOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              className="absolute inset-0 bg-black/40"
              aria-label="Close menu"
              onClick={() => setMobileOpen(false)}
            />
            <div className="absolute left-0 top-0 bottom-0 w-[280px] bg-white flex flex-col shadow-2xl">
              <div className="flex items-center justify-between px-4 py-4 border-b">
                <span className="font-serif tracking-[2px] uppercase">Menu</span>
                <button type="button" onClick={() => setMobileOpen(false)} className="p-2">
                  <FiX className="text-xl" />
                </button>
              </div>
              <div className="py-4 flex-1 overflow-y-auto">
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 p-4 md:p-8 max-w-[1200px] w-full mx-auto print:p-0 print:max-w-none">
          <AdminHowTo />
          {children}
        </div>
        <AdminNewOrderToast />
      </div>
    </div>
  );
}
