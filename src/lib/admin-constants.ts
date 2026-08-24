export const ORDER_STATUSES = [
  "Confirmation Pending",
  "Confirmed",
  "Packed",
  "Shipped",
  "In Transit",
  "Delivered",
  "Cancelled",
  "Returned",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const PRODUCT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "Free Size"] as const;

export const PRODUCT_TAG_OPTIONS = [
  "Best Seller",
  "Sale",
  "New",
  "Trending",
  "Premium",
  "Bestseller",
  "Fast Selling",
  "Wedding Guest",
] as const;
