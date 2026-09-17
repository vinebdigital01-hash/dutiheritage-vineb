import type { Product, Collection } from "@/types";
import type { OrderStatus } from "@/models/Order";

type LeanDoc = {
  _id: { toString(): string };
  [key: string]: unknown;
};

export function toProduct(doc: LeanDoc): Product & { isActive?: boolean } {
  return {
    id: doc._id.toString(),
    name: String(doc.name ?? ""),
    slug: String(doc.slug ?? ""),
    price: Number(doc.price ?? 0),
    salePrice: (doc.salePrice as number | null | undefined) ?? null,
    image: String(doc.image ?? ""),
    images: (doc.images as string[] | undefined) ?? [],
    description: (doc.description as string | undefined) ?? "",
    sizes: (doc.sizes as string[] | undefined) ?? [],
    colors: (doc.colors as string[] | undefined) ?? [],
    collectionId: String(doc.collectionId ?? ""),
    seoTitle: doc.seoTitle as string | undefined,
    seoDescription: doc.seoDescription as string | undefined,
    badge: doc.badge as string | undefined,
    tags: (doc.tags as string[] | undefined) ?? [],
    boughtLast7Days: (doc.boughtLast7Days as number | undefined) ?? 0,
    videoUrls: (doc.videoUrls as string[] | undefined) ?? [],
    offers: (doc.offers as Product["offers"]) ?? [],
    codAvailable: (doc.codAvailable as boolean | undefined) ?? true,
    isPartialCOD: (doc.isPartialCOD as boolean | undefined) ?? false,
    partialCODAdvance: (doc.partialCODAdvance as number | undefined) ?? 0,
    isActive: doc.isActive !== false,
    inventory: ((doc.inventory as any[]) || []).map((i: any) => ({ size: String(i.size || ""), stock: Number(i.stock || 0), sku: String(i.sku || "") })),
    trackInventory: Boolean(doc.trackInventory),
    lowStockThreshold: (doc.lowStockThreshold as number | undefined) ?? 3,
    stockStatus: (doc.stockStatus as Product["stockStatus"]) ?? "in_stock",
    hsn: (doc.hsn as string | undefined) || "6104",
    gstRate: Number(doc.gstRate ?? 5),
  };
}

export function toCollection(doc: LeanDoc): Collection & { isActive?: boolean } {
  return {
    id: doc._id.toString(),
    name: String(doc.name ?? ""),
    slug: String(doc.slug ?? ""),
    productCount: (doc.productCount as number | undefined) ?? 0,
    isActive: doc.isActive !== false,
  };
}

export type OrderDTO = {
  id: string;
  orderId: string;
  customerId?: string | null;
  firebaseUid?: string | null;
  customer: {
    name: string;
    email?: string;
    phone: string;
    address: string;
    apartment?: string;
    city: string;
    state: string;
    pinCode: string;
    country?: string;
  };
  items: Array<{
    productId: string;
    slug?: string;
    name: string;
    image?: string;
    size?: string;
    color?: string;
    quantity: number;
    price: number;
    salePrice?: number;
    hsn?: string;
    gstRate?: number;
  }>;
  subtotal: number;
  discount: number;
  shipping: number;
  codCharge: number;
  prepaidDiscount: number;
  total: number;
  paymentMethod: "prepaid" | "cod" | "partial";
  paymentStatus: string;
  razorpayPaymentId?: string | null;
  refundedAmount?: number;
  couponCode?: string | null;
  status: OrderStatus;
  trackingInfo?: {
    awb?: string;
    courier?: string;
    trackingUrl?: string;
  } | null;
  notes?: string | null;
  tags?: string[];
  statusReason?: string | null;
  cancelRequestState?: "none" | "requested" | "rejected" | "accepted";
  cancelRejectReason?: string | null;
  timeline?: Array<{
    at: string;
    actor: string;
    action: string;
    fromStatus?: string;
    toStatus?: string;
    message?: string;
    internal?: boolean;
  }>;
  createdAt?: string;
  updatedAt?: string;
};

export function toOrder(
  doc: LeanDoc,
  opts?: { includeTimeline?: boolean; includeInternal?: boolean }
): OrderDTO {
  const customer = (doc.customer || {}) as OrderDTO["customer"];
  const tracking = doc.trackingInfo as OrderDTO["trackingInfo"];
  const includeTimeline = opts?.includeTimeline !== false;
  const includeInternal = opts?.includeInternal === true;

  const rawTimeline = (Array.isArray(doc.timeline) ? doc.timeline : []) as Array<{
    at?: string | Date;
    actor?: string;
    action?: string;
    fromStatus?: string;
    toStatus?: string;
    message?: string;
    internal?: boolean;
  }>;

  return {
    id: String(doc._id || doc.id || ""),
    orderId: String(doc.orderId || ""),
    customerId: doc.customerId
      ? String((doc.customerId as { toString(): string }).toString())
      : null,
    firebaseUid: doc.firebaseUid ? String(doc.firebaseUid) : null,
    customer: {
      name: String(customer.name || ""),
      email: customer.email ? String(customer.email) : undefined,
      phone: String(customer.phone || ""),
      address: String(customer.address || ""),
      apartment: customer.apartment ? String(customer.apartment) : undefined,
      city: String(customer.city || ""),
      state: String(customer.state || ""),
      pinCode: String(customer.pinCode || ""),
      country: String(customer.country || "IN"),
    },
    items: Array.isArray(doc.items)
      ? doc.items.map((i: any) => ({
          productId: String(i.productId || ""),
          slug: i.slug ? String(i.slug) : undefined,
          name: String(i.name || ""),
          image: i.image ? String(i.image) : undefined,
          size: i.size ? String(i.size) : undefined,
          color: i.color ? String(i.color) : undefined,
          quantity: Number(i.quantity) || 1,
          price: Number(i.price) || 0,
          salePrice: i.salePrice != null ? Number(i.salePrice) : undefined,
          hsn: i.hsn ? String(i.hsn) : undefined,
          gstRate: i.gstRate != null ? Number(i.gstRate) : undefined,
        }))
      : [],
    subtotal: Number(doc.subtotal) || 0,
    discount: Number(doc.discount) || 0,
    shipping: Number(doc.shipping) || 0,
    codCharge: Number(doc.codCharge) || 0,
    prepaidDiscount: Number(doc.prepaidDiscount) || 0,
    total: Number(doc.total) || 0,
    paymentMethod: String(doc.paymentMethod || "") as OrderDTO["paymentMethod"],
    paymentStatus: String(doc.paymentStatus || "pending") as OrderDTO["paymentStatus"],
    razorpayPaymentId: doc.razorpayPaymentId ? String(doc.razorpayPaymentId) : null,
    refundedAmount: Number(doc.refundedAmount) || 0,
    couponCode: (doc.couponCode as string | undefined) ?? null,
    status: doc.status as OrderStatus,
    trackingInfo: tracking
      ? {
          awb: tracking.awb ? String(tracking.awb) : undefined,
          courier: tracking.courier ? String(tracking.courier) : undefined,
          trackingUrl: tracking.trackingUrl ? String(tracking.trackingUrl) : undefined,
        }
      : null,
    notes: (doc.notes as string | undefined) ?? null,
    tags: Array.isArray(doc.tags) ? doc.tags.map(String) : [],
    statusReason: (doc.statusReason as string | undefined) ?? null,
    cancelRequestState: (doc.cancelRequestState as any) || "none",
    cancelRejectReason: (doc.cancelRejectReason as string | undefined) ?? null,
    timeline: includeTimeline
      ? rawTimeline
          .filter((e) => includeInternal || !e.internal)
          .map((e) => ({
            ...e,
            at: e.at ? new Date(e.at).toISOString() : new Date().toISOString(),
            actor: e.actor || "system",
            action: e.action || "unknown",
          }))
      : undefined,
    createdAt: doc.createdAt
      ? new Date(doc.createdAt as string | Date).toISOString()
      : undefined,
    updatedAt: doc.updatedAt
      ? new Date(doc.updatedAt as string | Date).toISOString()
      : undefined,
  };
}
