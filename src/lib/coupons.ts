import { connectDB } from "@/lib/mongodb";
import { Coupon } from "@/models";
import { ApiError } from "@/lib/api";

export type CouponDTO = {
  id: string;
  code: string;
  discountType: "PERCENT" | "FLAT" | "BUY_X_PERCENT" | "BUY_X_GET_Y_FREE";
  discountValue: number;
  scope: "ALL_PRODUCTS" | "SPECIFIC_CATEGORY" | "SPECIFIC_PRODUCTS";
  targetIds: string[];
  minQuantity: number;
  freeQuantity: number;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  minOrderAmount: number;
  usedCount: number;
  active: boolean;
  expiresAt?: string | null;
};

export type PublicCouponDTO = {
  code: string;
  discountType: "PERCENT" | "FLAT" | "BUY_X_PERCENT" | "BUY_X_GET_Y_FREE";
  discountValue: number;
  minOrderAmount: number;
};

type LeanCoupon = {
  _id: { toString(): string };
  code: string;
  discountType: string;
  discountValue: number;
  scope?: string;
  targetIds?: string[];
  minQuantity?: number;
  freeQuantity?: number;
  usageLimit?: number | null;
  perUserLimit?: number | null;
  minOrderAmount?: number;
  usedCount?: number;
  active?: boolean;
  expiresAt?: Date | string | null;
};

export function toCoupon(doc: LeanCoupon): CouponDTO {
  return {
    id: doc._id.toString(),
    code: doc.code,
    discountType: doc.discountType as CouponDTO["discountType"],
    discountValue: doc.discountValue,
    scope: (doc.scope as CouponDTO["scope"]) || "ALL_PRODUCTS",
    targetIds: doc.targetIds ?? [],
    minQuantity: doc.minQuantity ?? 0,
    freeQuantity: doc.freeQuantity ?? 0,
    usageLimit: doc.usageLimit ?? null,
    perUserLimit: doc.perUserLimit ?? null,
    minOrderAmount: doc.minOrderAmount ?? 0,
    usedCount: doc.usedCount ?? 0,
    active: doc.active !== false,
    expiresAt: doc.expiresAt
      ? new Date(doc.expiresAt).toISOString()
      : null,
  };
}

export function toPublicCoupon(doc: LeanCoupon): PublicCouponDTO {
  return {
    code: doc.code,
    discountType: doc.discountType as PublicCouponDTO["discountType"],
    discountValue: doc.discountValue,
    minOrderAmount: doc.minOrderAmount ?? 0,
  };
}

export async function validateCouponCode(input: {
  code: string;
  subtotal: number;
  productIds?: string[];
  collectionIds?: string[];
  items?: Array<{ productId: string; collectionId?: string; price: number; quantity: number; }>;
}): Promise<{
  code: string;
  discountType: "PERCENT" | "FLAT" | "BUY_X_PERCENT" | "BUY_X_GET_Y_FREE";
  discountValue: number;
  amount: number;
  minOrderAmount: number;
}> {
  const normalized = input.code.trim().toUpperCase();
  if (!normalized) throw new ApiError("Coupon code is required", 400);

  await connectDB();
  const coupon = await Coupon.findOne({ code: normalized }).lean();
  if (!coupon || coupon.active === false) {
    throw new ApiError("Invalid coupon code", 400);
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    throw new ApiError("This coupon has expired", 400);
  }

  if (
    coupon.usageLimit != null &&
    (coupon.usedCount ?? 0) >= coupon.usageLimit
  ) {
    throw new ApiError("This coupon has reached its usage limit", 400);
  }

  const minOrder = coupon.minOrderAmount ?? 0;
  if (input.subtotal < minOrder) {
    throw new ApiError(
      `Minimum order of ₹${minOrder} required for this coupon`,
      400
    );
  }

  const scope = coupon.scope || "ALL_PRODUCTS";
  const targets = new Set(coupon.targetIds ?? []);
  
  if (scope === "SPECIFIC_PRODUCTS") {
    const hit = (input.productIds ?? []).some((id) => targets.has(id));
    if (!hit) throw new ApiError("This coupon does not apply to items in your cart", 400);
  }
  if (scope === "SPECIFIC_CATEGORY") {
    const hit = (input.collectionIds ?? []).some((id) => targets.has(id));
    if (!hit) throw new ApiError("This coupon does not apply to collections in your cart", 400);
  }

  let amount = 0;

  if (coupon.discountType === "PERCENT") {
    amount = Math.round((input.subtotal * coupon.discountValue) / 100);
  } else if (coupon.discountType === "FLAT") {
    amount = coupon.discountValue;
  } else if (coupon.discountType === "BUY_X_PERCENT" || coupon.discountType === "BUY_X_GET_Y_FREE") {
    if (!input.items) {
      throw new ApiError("Item details required to calculate bundle discount", 400);
    }
    
    // Filter applicable items
    const applicableItems = input.items.filter(item => {
      if (scope === "ALL_PRODUCTS") return true;
      if (scope === "SPECIFIC_PRODUCTS") return targets.has(item.productId);
      if (scope === "SPECIFIC_CATEGORY" && item.collectionId) return targets.has(item.collectionId);
      return false;
    });

    const totalApplicableQty = applicableItems.reduce((sum, item) => sum + item.quantity, 0);
    const minQty = coupon.minQuantity || 0;

    if (totalApplicableQty < minQty) {
      throw new ApiError(`Add ${minQty - totalApplicableQty} more qualifying item(s) to apply this offer`, 400);
    }

    if (coupon.discountType === "BUY_X_PERCENT") {
      const applicableSubtotal = applicableItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      amount = Math.round((applicableSubtotal * coupon.discountValue) / 100);
    } else if (coupon.discountType === "BUY_X_GET_Y_FREE") {
      // Free items are usually the cheapest items
      // Flatten items into single unit array for sorting
      const unitPrices: number[] = [];
      applicableItems.forEach(item => {
        for(let i=0; i<item.quantity; i++) {
          unitPrices.push(item.price);
        }
      });
      unitPrices.sort((a, b) => a - b); // Ascending
      
      const freeQty = coupon.freeQuantity || 1;
      
      // If buy 3 get 1 free, and min qty is 3, means 3 items total gives 1 free.
      // But standard "Buy 2 Get 1 Free" usually means minQty = 3. 
      // Let's assume minQty is the total items required (e.g. 3).
      // Calculate how many times the offer applies:
      const timesApplied = Math.floor(totalApplicableQty / minQty);
      const totalFreeItems = timesApplied * freeQty;
      
      amount = unitPrices.slice(0, totalFreeItems).reduce((sum, price) => sum + price, 0);
    }
  }

  return {
    code: coupon.code,
    discountType: coupon.discountType as any,
    discountValue: coupon.discountValue,
    amount: Math.min(amount, input.subtotal),
    minOrderAmount: minOrder,
  };
}
