/**
 * Shared domain types used by API routes and admin (beyond storefront Product/Collection).
 */

export type PaymentMethod = "prepaid" | "cod" | "partial";
export type PaymentStatus =
  | "pending"
  | "paid"
  | "partially_paid"
  | "failed"
  | "refunded";

export type DiscountType = "PERCENT" | "FLAT";

export type CouponScope =
  | "ALL_PRODUCTS"
  | "SPECIFIC_CATEGORY"
  | "SPECIFIC_PRODUCTS";

export type CodMode = "ALL_INDIA" | "CITY_LIST" | "PINCODE_LIST";

export type CartStatus = "active" | "abandoned" | "emailed" | "purchased";

export type ReviewStatus = "approved" | "pending" | "rejected";
