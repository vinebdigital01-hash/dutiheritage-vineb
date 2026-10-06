import type { Product } from "@/types";

export type BrowseSort = "newest" | "price-asc" | "price-desc" | "discount";

export const BROWSE_PAGE_SIZE = 24;

export function productUnitPrice(p: Product): number {
  return p.salePrice && p.salePrice < p.price ? p.salePrice : p.price;
}

export function productInStock(p: Product): boolean {
  const rows = p.inventory || [];
  if (p.trackInventory || rows.length > 0) {
    return rows.some((r) => Number(r.stock || 0) > 0);
  }
  return true;
}

export function productOnSale(p: Product): boolean {
  return Boolean(p.salePrice && p.salePrice < p.price);
}

export function productMatchesQuery(p: Product, q: string): boolean {
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  const hay = [p.name, p.slug, p.description, ...(p.tags || [])]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(needle);
}

export function filterAndSortProducts(
  products: Product[],
  opts: {
    q?: string;
    inStock?: boolean;
    onSale?: boolean;
    size?: string;
    sort?: BrowseSort;
  }
): Product[] {
  let list = products;
  if (opts.q?.trim()) {
    list = list.filter((p) => productMatchesQuery(p, opts.q!));
  }
  if (opts.inStock) {
    list = list.filter(productInStock);
  }
  if (opts.onSale) {
    list = list.filter(productOnSale);
  }
  if (opts.size) {
    list = list.filter((p) => (p.sizes || []).includes(opts.size!) || (p.inventory || []).some((r) => r.size === opts.size));
  }

  const sort = opts.sort || "newest";
  const copy = [...list];
  if (sort === "price-asc") {
    copy.sort((a, b) => productUnitPrice(a) - productUnitPrice(b));
  } else if (sort === "price-desc") {
    copy.sort((a, b) => productUnitPrice(b) - productUnitPrice(a));
  } else if (sort === "discount") {
    copy.sort((a, b) => {
      const da = productOnSale(a) ? a.price - a.salePrice! : 0;
      const db = productOnSale(b) ? b.price - b.salePrice! : 0;
      return db - da;
    });
  } else {
    copy.reverse();
  }
  return copy;
}

export function uniqueSizes(products: Product[]): string[] {
  const set = new Set<string>();
  for (const p of products) {
    (p.sizes || []).forEach((s) => s && set.add(s));
    (p.inventory || []).forEach((r) => r.size && set.add(r.size));
  }
  return [...set];
}
