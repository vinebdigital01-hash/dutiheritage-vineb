import type { Product } from "@/types";
import type { OrderDTO } from "@/lib/mappers";

type OrderLine = OrderDTO["items"][number];

/** Minimal product shape so addToCart can run without inventing stock caps. */
export function productFromOrderLine(item: OrderLine): Product {
  return {
    id: item.productId,
    name: item.name,
    slug: item.slug || item.productId,
    price: item.price,
    salePrice: item.salePrice ?? item.price,
    image: item.image || "",
    collectionId: "",
    description: "",
    colors: item.color ? [item.color] : [],
    sizes: item.size ? [item.size] : [],
    images: item.image ? [item.image] : [],
  };
}

/**
 * Re-add order lines to cart with size and colour.
 * Calls addToCart once per unit so quantity matches the original order.
 */
export function reorderOrderLines(
  items: OrderLine[],
  addToCart: (product: Product, size: string, color?: string) => void
) {
  for (const item of items) {
    const product = productFromOrderLine(item);
    const size = item.size || "Free Size";
    const qty = Math.max(1, Number(item.quantity) || 1);
    for (let i = 0; i < qty; i++) {
      addToCart(product, size, item.color || undefined);
    }
  }
}
