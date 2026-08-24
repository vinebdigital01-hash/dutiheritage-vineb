export type NavLink = { label: string; slug: string };

export type SiteContentData = {
  announcementText?: string;
  headerNavLinks?: NavLink[];
  homepageSlugs?: string[];
  promoBanner?: {
    headline?: string;
    subtext?: string;
    buttonText?: string;
  };
  footer?: {
    companyName?: string;
    phone?: string;
    email?: string;
    address?: string;
    copyright?: string;
  };
};

export const DEFAULT_HOMEPAGE_SLUGS = [
  "new-arrivals",
  "new-western-launch",
  "on-sale",
  "duti-heritage-luxe",
  "unstitched-sale",
  "premium-night-wear",
  "unstitched",
  "velvet",
  "wedding",
  "best-sellers",
  "dresses",
  "tops-shirts",
  "popular-picks",
];

export const DEFAULT_HEADER_NAV: NavLink[] = [
  { label: "HOME", slug: "" },
  { label: "DRESSES", slug: "dresses" },
  { label: "PREMIUM NIGHT WEAR", slug: "premium-night-wear" },
  { label: "BEST SELLERS", slug: "best-sellers" },
  { label: "VELVET COLLECTION", slug: "velvet" },
  { label: "UNSTITCHED", slug: "unstitched" },
  { label: "WEDDING", slug: "wedding" },
  { label: "ON SALE", slug: "on-sale" },
];

export const POLICY_LINKS = [
  { href: "/privacy-policy", label: "Privacy Policy" },
  { href: "/return-exchange", label: "Return/Exchange Policy" },
  { href: "/terms-conditions", label: "Terms & Conditions" },
  { href: "/shipping", label: "Shipping Policy" },
];

export function navHref(slug: string): string {
  if (!slug || slug === "home") return "/";
  if (slug.startsWith("/")) return slug;
  if (slug.startsWith("collections/")) return `/${slug}`;
  return `/collections/${slug}`;
}

export function resolveHomepageSlugs(content: SiteContentData): string[] {
  const slugs = content.homepageSlugs?.filter(Boolean);
  return slugs?.length ? slugs : DEFAULT_HOMEPAGE_SLUGS;
}

export function resolveHeaderNav(content: SiteContentData): NavLink[] {
  const links = content.headerNavLinks?.filter(
    (l) => l.label && l.slug !== undefined
  );
  return links?.length ? links : DEFAULT_HEADER_NAV;
}
