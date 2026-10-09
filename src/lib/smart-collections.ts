import type { Collection, Product } from "@/types";
import { db } from "@/services/db";
import { productOnSale } from "@/lib/catalog-browse";

/**
 * Virtual / smart collection slugs — not Mongo Collection documents.
 * Rule (I1):
 * - best-sellers / popular-picks: boughtLast7Days, then tags Best Seller / Popular, then name
 * - on-sale: salePrice < price, or tag Sale / On Sale
 * - new-arrivals: newest active products (by boughtLast7Days fallback then name)
 * If a real Collection with the same slug exists, we still use these product rules
 * for the known smart slugs (nav promises a curated list).
 */
export const SMART_COLLECTION_SLUGS = [
  "best-sellers",
  "on-sale",
  "popular-picks",
  "new-arrivals",
] as const;

export type SmartCollectionSlug = (typeof SMART_COLLECTION_SLUGS)[number];

export function isSmartCollectionSlug(slug: string): slug is SmartCollectionSlug {
  return (SMART_COLLECTION_SLUGS as readonly string[]).includes(slug);
}

const SMART_META: Record<
  SmartCollectionSlug,
  { name: string; id: string }
> = {
  "best-sellers": { name: "Best Sellers", id: "smart:best-sellers" },
  "on-sale": { name: "On Sale", id: "smart:on-sale" },
  "popular-picks": { name: "Popular Picks", id: "smart:popular-picks" },
  "new-arrivals": { name: "New Arrivals", id: "smart:new-arrivals" },
};

function tagHit(p: Product, needles: string[]) {
  const tags = (p.tags || []).map((t) => t.toLowerCase());
  return needles.some((n) => tags.includes(n.toLowerCase()));
}

function rankBestSeller(p: Product): number {
  let score = Number(p.boughtLast7Days) || 0;
  if (tagHit(p, ["best seller", "bestseller", "best-sellers", "bestsellers"])) {
    score += 10_000;
  }
  if (tagHit(p, ["popular", "popular picks"])) score += 5_000;
  return score;
}

function pickBestSellers(all: Product[], limit: number): Product[] {
  return [...all]
    .sort((a, b) => {
      const d = rankBestSeller(b) - rankBestSeller(a);
      if (d !== 0) return d;
      return a.name.localeCompare(b.name);
    })
    .filter((p) => rankBestSeller(p) > 0 || tagHit(p, ["best seller", "bestseller", "popular"]))
    .slice(0, limit);
}

function pickOnSale(all: Product[], limit: number): Product[] {
  const list = all.filter(
    (p) =>
      productOnSale(p) ||
      tagHit(p, ["sale", "on sale", "on-sale"])
  );
  return list
    .sort((a, b) => {
      const da = productOnSale(a) ? a.price - (a.salePrice || a.price) : 0;
      const db = productOnSale(b) ? b.price - (b.salePrice || b.price) : 0;
      return db - da;
    })
    .slice(0, limit);
}

function pickNewArrivals(all: Product[], limit: number): Product[] {
  // Prefer products tagged New / New Arrival; else take a fresh slice by name stability
  const tagged = all.filter((p) =>
    tagHit(p, ["new", "new arrival", "new arrivals", "new-arrivals"])
  );
  if (tagged.length) return tagged.slice(0, limit);
  return [...all].reverse().slice(0, limit);
}

export async function getSmartCollectionProducts(
  slug: SmartCollectionSlug,
  limit = 48
): Promise<Product[]> {
  const all = await db.getAllProducts();
  if (slug === "best-sellers" || slug === "popular-picks") {
    const picked = pickBestSellers(all, limit);
    // If nothing ranked yet, fall back to top by boughtLast7Days / name so page is never empty of “logic”
    if (picked.length) return picked;
    return [...all]
      .sort((a, b) => (Number(b.boughtLast7Days) || 0) - (Number(a.boughtLast7Days) || 0))
      .slice(0, limit);
  }
  if (slug === "on-sale") return pickOnSale(all, limit);
  if (slug === "new-arrivals") return pickNewArrivals(all, limit);
  return [];
}

export function smartCollectionMeta(slug: SmartCollectionSlug): Collection {
  const meta = SMART_META[slug];
  return {
    id: meta.id,
    name: meta.name,
    slug,
    productCount: 0,
  };
}

/**
 * Resolve a homepage / browse slug to a collection + products.
 * Smart slugs always resolve (never 404). Real Mongo collections otherwise.
 */
export async function resolveCollectionBrowse(slug: string): Promise<{
  collection: Collection;
  products: Product[];
  smart: boolean;
} | null> {
  if (slug === "all") {
    const products = await db.getAllProducts();
    return {
      collection: {
        id: "all",
        name: "All Products",
        slug: "all",
        productCount: products.length,
      },
      products,
      smart: false,
    };
  }

  if (isSmartCollectionSlug(slug)) {
    const products = await getSmartCollectionProducts(slug);
    const collection = {
      ...smartCollectionMeta(slug),
      productCount: products.length,
    };
    return { collection, products, smart: true };
  }

  const collection = await db.getCollectionBySlug(slug);
  if (!collection) return null;
  const products = await db.getProductsByCollectionId(collection.id);
  return {
    collection: { ...collection, productCount: products.length },
    products,
    smart: false,
  };
}
