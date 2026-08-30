"use client";
import { SkeletonTable } from "@/components/ui/Skeleton";
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
  FiLayers,
  FiShield,
  FiActivity
} from "react-icons/fi";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: FiHome, exact: true, roles: ["SUPERADMIN", "ADMIN", "MANAGER"] },
  { href: "/admin/products", label: "Products", icon: FiBox, roles: ["SUPERADMIN", "ADMIN", "MANAGER"] },
  { href: "/admin/collections", label: "Collections", icon: FiGrid, roles: ["SUPERADMIN", "ADMIN", "MANAGER"] },
  { href: "/admin/orders", label: "Orders", icon: FiPackage, roles: ["SUPERADMIN", "ADMIN", "MANAGER"] },
  { href: "/admin/customers", label: "Customers", icon: FiUsers, roles: ["SUPERADMIN", "ADMIN", "MANAGER"] },
  { href: "/admin/analytics", label: "Insights", icon: FiBarChart2, roles: ["SUPERADMIN", "ADMIN", "MANAGER"] },
  { href: "/admin/reviews", label: "Reviews", icon: FiMessageSquare, roles: ["SUPERADMIN", "ADMIN", "MANAGER"] },
  { href: "/admin/groups", label: "Groups", icon: FiLayers, roles: ["SUPERADMIN", "ADMIN"] },
  { href: "/admin/coupons", label: "Coupons", icon: FiTag, roles: ["SUPERADMIN", "ADMIN"] },
  { href: "/admin/automations", label: "Automations", icon: FiZap, roles: ["SUPERADMIN", "ADMIN"] },
  { href: "/admin/content", label: "Site content", icon: FiEdit3, roles: ["SUPERADMIN", "ADMIN"] },
  { href: "/admin/settings/cod", label: "COD & Shipping", icon: FiSettings, roles: ["SUPERADMIN", "ADMIN"] },
  { href: "/admin/staff", label: "Staff", icon: FiShield, roles: ["SUPERADMIN"] },
    { href: "/admin/logs", label: "System Logs", icon: FiActivity, roles: ["SUPERADMIN"] },
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, adminRole, authLoading, logout } = useAppContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      router.replace(`/account?next=${encodeURIComponent(pathname || "/admin")}`);
      return;
    }
    if (!isAdmin) {
      setDenied(true);
    }
  }, [authLoading, user, isAdmin, router, pathname]);

  if (authLoading) {
    return (
      <div className="min-h-screen p-8 bg-[var(--color-bg)]"><SkeletonTable /></div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg)]">
        <p className="text-[13px] tracking-[2px] uppercase text-[var(--color-text-muted)]">
          Redirecting to login…
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
          Signed in as <span className="text-black font-medium">{user.email}</span>.
          This account is not authorized for the admin dashboard.
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
            onClick={() => logout()}
            className="bg-black text-white px-6 py-3 text-[12px] tracking-[2px] uppercase hover:bg-black/90"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => {
    // Filter nav items by the user's role
    const allowedNav = NAV.filter((item) => {
      if (!adminRole) return false;
      return item.roles.includes(adminRole);
    });

    return (
      <nav className="flex flex-col gap-1 px-3">
        {allowedNav.map((item) => {
          const active = item.exact
            ? pathname === item.href
            : pathname === item.href || pathname?.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={`flex items-center gap-3 px-3 py-2.5 text-[13px] tracking-[0.5px] transition-colors rounded-lg ${
                active
                  ? "bg-black text-white"
                  : "text-neutral-600 hover:bg-neutral-100 hover:text-black"
              }`}
            >
              <Icon className="text-[16px] shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-black flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-[260px] shrink-0 flex-col border-r border-[var(--color-border)] bg-white">
        <div className="px-6 py-6 border-b border-[var(--color-border)]">
          <p className="text-[10px] tracking-[3px] uppercase text-[var(--color-text-muted)] mb-1">
            Duti Heritage
          </p>
          <h1 className="text-lg font-serif tracking-[2px] uppercase">Admin</h1>
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
            onClick={() => logout()}
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

      {/* Mobile header */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="lg:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 bg-white border-b border-[var(--color-border)]">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="p-2 -ml-2"
            aria-label="Open menu"
          >
            <FiMenu className="text-xl" />
          </button>
          <span className="text-[13px] tracking-[2px] uppercase font-medium">
            Admin
          </span>
          <Link href="/" className="text-[11px] tracking-[1px] uppercase text-neutral-500">
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

        <div className="flex-1 p-4 md:p-8 max-w-[1200px] w-full mx-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
