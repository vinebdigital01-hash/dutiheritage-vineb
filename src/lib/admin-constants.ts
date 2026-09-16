export const ORDER_STATUSES = [
  "Confirmation Pending",
  "On Hold",
  "Confirmed",
  "Packed",
  "Shipped",
  "In Transit",
  "Delivered",
  "Cancelled",
  "Returned",
] as const;

export const CUSTOMER_ORDER_FLOW = ORDER_STATUSES.filter(
  (s) => !["Cancelled", "Returned", "On Hold"].includes(s)
);

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
