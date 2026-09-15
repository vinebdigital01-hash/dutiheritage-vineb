with open("src/services/checkout.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_func = """export async function resolveCouponDiscount(
  code: string | undefined | null,
  subtotal: number,
  opts?: { productIds?: string[]; collectionIds?: string[] }
): Promise<{ code: string; amount: number } | null> {
  if (!code?.trim()) return null;
  const { validateCouponCode } = await import("@/lib/coupons");
  const result = await validateCouponCode({
    code,
    subtotal,
    productIds: opts?.productIds,
    collectionIds: opts?.collectionIds,
  });"""

new_func = """export async function resolveCouponDiscount(
  code: string | undefined | null,
  subtotal: number,
  opts?: { 
    productIds?: string[]; 
    collectionIds?: string[];
    items?: Array<{ productId: string; collectionId?: string; price: number; quantity: number; }>;
  }
): Promise<{ code: string; amount: number } | null> {
  if (!code?.trim()) return null;
  const { validateCouponCode } = await import("@/lib/coupons");
  const result = await validateCouponCode({
    code,
    subtotal,
    productIds: opts?.productIds,
    collectionIds: opts?.collectionIds,
    items: opts?.items,
  });"""

content = content.replace(old_func, new_func)
with open("src/services/checkout.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated checkout.ts")
