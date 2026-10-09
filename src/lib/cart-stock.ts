import type { Product } from "@/types";

type StockProduct = Pick<Product, "trackInventory" | "inventory" | "sizes" | "lowStockThreshold">;

type InventoryRow = { size?: string | null; color?: string | null; stock?: number | null; sku?: string | null };

function normalizeSizeKey(s: string): string {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** Match inventory row to a size label (case/spacing tolerant; Free Size aliases). */
export function findInventoryRow(
  product: { inventory?: InventoryRow[] | null; sizes?: string[] },
  size: string,
  color?: string
): InventoryRow | undefined {
  const rows = product.inventory || [];
  if (!rows.length) return undefined;
  const want = normalizeSizeKey(size);
  const aliases = new Set(
    [want, "free size", "onesize", "one size", "os", "free"].filter(Boolean)
  );

  const exact = rows.find((r) => {
    const sizeMatch = normalizeSizeKey(r.size || "") === want;
    if (!color) return sizeMatch;
    return sizeMatch && (!r.color || r.color === color);
  });
  if (exact) return exact;

  if (
    aliases.has(want) ||
    want === "free size" ||
    want === "one size" ||
    want === "onesize"
  ) {
    const free = rows.find((r) => {
      const k = normalizeSizeKey(r.size || "");
      const sizeMatch = (
        !k ||
        k === "free size" ||
        k === "free" ||
        k === "one size" ||
        k === "onesize" ||
        k === "os" ||
        k === "default"
      );
      if (!color) return sizeMatch;
      return sizeMatch && (!r.color || r.color === color);
    });
    if (free) return free;
  }

  if (rows.length === 1) return rows[0];
  return undefined;
}

export function enforcesStockCap(product: StockProduct): boolean {
  if (product.trackInventory) return true;
  return Array.isArray(product.inventory) && product.inventory.length > 0;
}

/** Remaining units for this size. `null` means inventory is not tracked (no cap). */
export function maxPurchasableQty(product: StockProduct, size: string, color?: string): number | null {
  if (!enforcesStockCap(product)) return null;
  const rows = product.inventory || [];
  if (!rows.length) return 0;
  const row = findInventoryRow(product, size, color);
  if (!row) return 0;
  return Math.max(0, Number(row.stock || 0));
}

export function isLowStockForSize(
  product: StockProduct,
  size: string,
  color?: string
): { low: boolean; stock: number } {
  const max = maxPurchasableQty(product, size, color);
  if (max === null) return { low: false, stock: 0 };
  const threshold = product.lowStockThreshold ?? 3;
  return { low: max > 0 && max <= threshold, stock: max };
}

export function qtyOfProductSizeInCart(
  cart: { id: string; selectedSize: string; selectedColor?: string; quantity: number }[],
  productId: string,
  size: string,
  color?: string
): number {
  const want = normalizeSizeKey(size);
  return cart
    .filter(
      (i) => i.id === productId && normalizeSizeKey(i.selectedSize) === want && (!color || i.selectedColor === color)
    )
    .reduce((s, i) => s + i.quantity, 0);
}

export function schemaAvailability(product: {
  trackInventory?: boolean;
  inventory?: { stock?: number }[];
  stockStatus?: string;
}): "https://schema.org/InStock" | "https://schema.org/OutOfStock" {
  if (product.stockStatus === "out_of_stock") {
    return "https://schema.org/OutOfStock";
  }
  const rows = product.inventory || [];
  const tracking = Boolean(product.trackInventory) || rows.length > 0;
  if (!tracking) return "https://schema.org/InStock";
  const anyInStock = rows.some((r) => Number(r.stock || 0) > 0);
  return anyInStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock";
}
