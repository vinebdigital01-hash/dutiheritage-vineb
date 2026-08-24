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
    isActive: doc.isActive !== false,
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
  }>;
  subtotal: number;
  discount: number;
  shipping: number;
  codCharge: number;
  prepaidDiscount: number;
  total: number;
  paymentMethod: "prepaid" | "cod" | "partial";
  paymentStatus: string;
  couponCode?: string | null;
  status: OrderStatus;
  trackingInfo?: {
    awb?: string;
    courier?: string;
    trackingUrl?: string;
  } | null;
  notes?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

export function toOrder(doc: LeanDoc): OrderDTO {
  const customer = (doc.customer || {}) as OrderDTO["customer"];
  const tracking = doc.trackingInfo as OrderDTO["trackingInfo"];

  return {
    id: doc._id.toString(),
    orderId: String(doc.orderId ?? ""),
    customerId: doc.customerId
      ? String((doc.customerId as { toString(): string }).toString())
      : null,
    firebaseUid: (doc.firebaseUid as string | undefined) ?? null,
    customer: {
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      address: customer.address,
      apartment: customer.apartment,
      city: customer.city,
      state: customer.state,
      pinCode: customer.pinCode,
      country: customer.country ?? "IN",
    },
    items: (doc.items as OrderDTO["items"]) ?? [],
    subtotal: Number(doc.subtotal ?? 0),
    discount: Number(doc.discount ?? 0),
    shipping: Number(doc.shipping ?? 0),
    codCharge: Number(doc.codCharge ?? 0),
    prepaidDiscount: Number(doc.prepaidDiscount ?? 0),
    total: Number(doc.total ?? 0),
    paymentMethod: doc.paymentMethod as OrderDTO["paymentMethod"],
    paymentStatus: String(doc.paymentStatus ?? "pending"),
    couponCode: (doc.couponCode as string | undefined) ?? null,
    status: doc.status as OrderStatus,
    trackingInfo: tracking ?? null,
    notes: (doc.notes as string | undefined) ?? null,
    createdAt: doc.createdAt
      ? new Date(doc.createdAt as string | Date).toISOString()
      : undefined,
    updatedAt: doc.updatedAt
      ? new Date(doc.updatedAt as string | Date).toISOString()
      : undefined,
  };
}
