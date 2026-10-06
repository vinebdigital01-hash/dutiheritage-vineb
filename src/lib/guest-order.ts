import type { OrderDTO } from "@/lib/mappers";

export const LAST_ORDER_STORAGE_KEY = "duti-heritage_last_order";

export function phoneLast10(phone: string): string {
  return String(phone || "").replace(/\D/g, "").slice(-10);
}

export function phonesMatch(a: string, b: string): boolean {
  const x = phoneLast10(a);
  const y = phoneLast10(b);
  return x.length === 10 && x === y;
}

/** Safe fields for guest success / track. No staff notes or Firebase ids. */
export function toGuestOrderView(order: OrderDTO) {
  const addressParts = [
    order.customer.address,
    order.customer.apartment,
    order.customer.city,
    order.customer.state,
    order.customer.pinCode,
  ].filter(Boolean);

  return {
    orderId: order.orderId,
    status: order.status,
    paymentMethod: order.paymentMethod,
    paymentStatus: order.paymentStatus,
    items: order.items.map((i) => ({
      name: i.name,
      image: i.image,
      size: i.size,
      color: i.color,
      quantity: i.quantity,
      price: i.salePrice ?? i.price,
    })),
    subtotal: order.subtotal,
    discount: order.discount,
    shipping: order.shipping,
    codCharge: order.codCharge,
    prepaidDiscount: order.prepaidDiscount,
    total: order.total,
    customer: {
      name: order.customer.name,
      phone: order.customer.phone,
      addressLine: addressParts.join(", "),
    },
    trackingInfo: order.trackingInfo || null,
    createdAt: order.createdAt,
  };
}

export type GuestOrderView = ReturnType<typeof toGuestOrderView>;
