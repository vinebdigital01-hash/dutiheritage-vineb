"use client";

import { useMemo, useState, useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProductCard } from "@/components/ProductCard/ProductCard";
import type { Product } from "@/types";
import {
  BROWSE_PAGE_SIZE,
  filterAndSortProducts,
  uniqueSizes,
  type BrowseSort,
} from "@/lib/catalog-browse";

export function CollectionBrowseClient({
  title,
  products,
}: {
  title: string;
  products: Product[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const q = searchParams.get("q") || "";
  const sort = (searchParams.get("sort") as BrowseSort) || "newest";
  const inStock = searchParams.get("inStock") === "1";
  const onSale = searchParams.get("onSale") === "1";
  const size = searchParams.get("size") || "";

  const [visible, setVisible] = useState(BROWSE_PAGE_SIZE);

  const sizes = useMemo(() => uniqueSizes(products), [products]);
  const filtered = useMemo(
    () => filterAndSortProducts(products, { q, sort, inStock, onSale, size }),
    [products, q, sort, inStock, onSale, size]
  );

  useEffect(() => {
    setVisible(BROWSE_PAGE_SIZE);
  }, [q, sort, inStock, onSale, size]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (!value) next.delete(key);
    else next.set(key, value);
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  const shown = filtered.slice(0, visible);

  return (
    <main className="w-full min-h-screen bg-[var(--color-bg)]">
      <div className="py-12 md:py-16 text-center px-4">
        <h1 className="text-2xl md:text-3xl font-serif tracking-[3px] uppercase">{title}</h1>
        {q ? (
          <p className="text-[13px] text-[var(--color-text-muted)] mt-4">
            Search for “{q}” · {filtered.length} {filtered.length === 1 ? "product" : "products"}
          </p>
        ) : (
          <p className="text-[13px] text-[var(--color-text-muted)] mt-4">
            {filtered.length} {filtered.length === 1 ? "product" : "products"}
          </p>
        )}
      </div>

      <div className="max-w-[1440px] mx-auto px-4 pb-24">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setParam("inStock", inStock ? "" : "1")}
              className={`text-[11px] tracking-[1px] uppercase border px-3 py-2 ${inStock ? "bg-black text-white border-black" : "border-[var(--color-border)]"}`}
            >
              In stock
            </button>
            <button
              type="button"
              onClick={() => setParam("onSale", onSale ? "" : "1")}
              className={`text-[11px] tracking-[1px] uppercase border px-3 py-2 ${onSale ? "bg-black text-white border-black" : "border-[var(--color-border)]"}`}
            >
              On sale
            </button>
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setParam("size", size === s ? "" : s)}
                className={`text-[11px] tracking-[1px] uppercase border px-3 py-2 ${size === s ? "bg-black text-white border-black" : "border-[var(--color-border)]"}`}
              >
                {s}
              </button>
            ))}
          </div>
          <label className="text-[12px] text-[var(--color-text-muted)] flex items-center gap-2">
            <span className="uppercase tracking-[1px]">Sort</span>
            <select
              value={sort}
              onChange={(e) => setParam("sort", e.target.value === "newest" ? "" : e.target.value)}
              className="border border-[var(--color-border)] bg-white px-3 py-2 text-[13px] text-[var(--color-text)] outline-none"
            >
              <option value="newest">Newest</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
              <option value="discount">Discount</option>
            </select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center text-[var(--color-text-muted)] py-12">
            No products match.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-10">
              {shown.map((product, index) => (
                <ProductCard key={product.id} product={product} index={index} priority={index < 4} />
              ))}
            </div>
            {visible < filtered.length ? (
              <div className="flex justify-center mt-12">
                <button
                  type="button"
                  onClick={() => setVisible((n) => n + BROWSE_PAGE_SIZE)}
                  className="border border-black px-8 py-3 text-[12px] tracking-[2px] uppercase hover:bg-black hover:text-white transition-colors"
                >
                  Load more
                </button>
              </div>
            ) : null}
          </>
        )}
      </div>
    </main>
  );
}
