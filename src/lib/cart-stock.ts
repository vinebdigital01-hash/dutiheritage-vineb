import type { Product } from "@/types";

type StockProduct = Pick<Product, "trackInventory" | "inventory">;

/** Remaining units for this size. `null` means inventory is not tracked (no cap). */
export function maxPurchasableQty(product: StockProduct, size: string): number | null {
  const rows = product.inventory || [];
  const tracking = Boolean(product.trackInventory) || rows.length > 0;
  if (!tracking) return null;
  if (!rows.length) return 0;
  const row =
    rows.find((r) => r.size === size) ??
    (rows.length === 1 ? rows[0] : undefined);
  return row ? Math.max(0, Number(row.stock || 0)) : 0;
}

export function qtyOfProductSizeInCart(
  cart: { id: string; selectedSize: string; quantity: number }[],
  productId: string,
  size: string
): number {
  return cart
    .filter((i) => i.id === productId && i.selectedSize === size)
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
