import type { StaffRole } from "@/models/Staff";

export const ALL_STAFF: StaffRole[] = ["SUPERADMIN", "ADMIN", "MANAGER"];
export const CATALOG_WRITE: StaffRole[] = ["SUPERADMIN", "ADMIN"];
export const SETTINGS_WRITE: StaffRole[] = ["SUPERADMIN", "ADMIN"];
export const STAFF_WRITE: StaffRole[] = ["SUPERADMIN"];
export const OPS_WRITE: StaffRole[] = ["SUPERADMIN", "ADMIN", "MANAGER"];
export const AUDIT_READ: StaffRole[] = ["SUPERADMIN", "ADMIN"];

/** Idle logout for /admin (30 minutes). */
export const ADMIN_IDLE_MS = 30 * 60 * 1000;

export type AdminNavItem = {
  href: string;
  exact?: boolean;
  roles: StaffRole[];
  section?: "daily" | "catalog" | "grow" | "store" | "team";
};

export const NAV_SECTIONS: { id: NonNullable<AdminNavItem["section"]>; label: string }[] = [
  { id: "daily", label: "Everyday" },
  { id: "catalog", label: "What you sell" },
  { id: "grow", label: "Marketing" },
  { id: "store", label: "Store setup" },
  { id: "team", label: "Team" },
];

/** Manager: orders/customers/inventory ops only — no prices, staff, or settings. */
export const ADMIN_NAV: AdminNavItem[] = [
  { href: "/admin", exact: true, roles: ALL_STAFF, section: "daily" },
  { href: "/admin/orders", roles: OPS_WRITE, section: "daily" },
  { href: "/admin/returns", roles: OPS_WRITE, section: "daily" },
  { href: "/admin/inventory", roles: OPS_WRITE, section: "daily" },
  { href: "/admin/customers", roles: OPS_WRITE, section: "daily" },
  { href: "/admin/reviews", roles: OPS_WRITE, section: "daily" },
  { href: "/admin/whatsapp", roles: OPS_WRITE, section: "daily" },
  { href: "/admin/products", roles: CATALOG_WRITE, section: "catalog" },
  { href: "/admin/collections", roles: CATALOG_WRITE, section: "catalog" },
  { href: "/admin/coupons", roles: CATALOG_WRITE, section: "catalog" },
  { href: "/admin/analytics", roles: CATALOG_WRITE, section: "grow" },
  { href: "/admin/reports", roles: CATALOG_WRITE, section: "grow" },
  { href: "/admin/groups", roles: CATALOG_WRITE, section: "grow" },
  { href: "/admin/automations", roles: SETTINGS_WRITE, section: "grow" },
  { href: "/admin/content", roles: SETTINGS_WRITE, section: "grow" },
  { href: "/admin/settings", roles: SETTINGS_WRITE, section: "store" },
  { href: "/admin/audit", roles: AUDIT_READ, section: "team" },
  { href: "/admin/staff", roles: STAFF_WRITE, section: "team" },
  { href: "/admin/logs", roles: STAFF_WRITE, section: "team" },
];

export function canRoleAccessPath(role: string | null | undefined, pathname: string): boolean {
  if (!role) return false;
  if (pathname === "/admin/login") return true;
  const match = [...ADMIN_NAV]
    .sort((a, b) => b.href.length - a.href.length)
    .find((item) =>
      item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(item.href + "/")
    );
  if (!match) return role === "SUPERADMIN";
  return match.roles.includes(role as StaffRole);
}

export function defaultAdminPath(role: string | null | undefined): string {
  if (role === "MANAGER") return "/admin/orders";
  return "/admin";
}
