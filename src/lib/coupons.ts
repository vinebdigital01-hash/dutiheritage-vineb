import { connectDB } from "@/lib/mongodb";
import { Coupon } from "@/models";
import { ApiError } from "@/lib/api";

export type CouponDTO = {
  id: string;
  code: string;
  discountType: "PERCENT" | "FLAT";
  discountValue: number;
  scope: "ALL_PRODUCTS" | "SPECIFIC_CATEGORY" | "SPECIFIC_PRODUCTS";
  targetIds: string[];
  usageLimit?: number | null;
  perUserLimit?: number | null;
  minOrderAmount: number;
  usedCount: number;
  active: boolean;
  expiresAt?: string | null;
};

export type PublicCouponDTO = {
  code: string;
  discountType: "PERCENT" | "FLAT";
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
}): Promise<{
  code: string;
  discountType: "PERCENT" | "FLAT";
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
  if (scope === "SPECIFIC_PRODUCTS") {
    const targets = new Set(coupon.targetIds ?? []);
    const hit = (input.productIds ?? []).some((id) => targets.has(id));
    if (!hit) {
      throw new ApiError("This coupon does not apply to items in your cart", 400);
    }
  }
  if (scope === "SPECIFIC_CATEGORY") {
    const targets = new Set(coupon.targetIds ?? []);
    const hit = (input.collectionIds ?? []).some((id) => targets.has(id));
    if (!hit) {
      throw new ApiError(
        "This coupon does not apply to collections in your cart",
        400
      );
    }
  }

  const amount =
    coupon.discountType === "PERCENT"
      ? Math.round((input.subtotal * coupon.discountValue) / 100)
      : coupon.discountValue;

  return {
    code: coupon.code,
    discountType: coupon.discountType as "PERCENT" | "FLAT",
    discountValue: coupon.discountValue,
    amount: Math.min(amount, input.subtotal),
    minOrderAmount: minOrder,
  };
}
