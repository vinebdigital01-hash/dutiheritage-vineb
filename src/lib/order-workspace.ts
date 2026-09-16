import type { OrderStatus } from "@/models/Order";

export type OrderTimelineEvent = {
  at: Date | string;
  actor: string;
  action: string;
  fromStatus?: string;
  toStatus?: string;
  message?: string;
  internal?: boolean;
};

export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function appendTimeline(
  order: { timeline?: unknown[] },
  event: Omit<OrderTimelineEvent, "at"> & { at?: Date }
) {
  if (!Array.isArray(order.timeline)) order.timeline = [];
  order.timeline.push({
    at: event.at || new Date(),
    actor: event.actor || "system",
    action: event.action,
    fromStatus: event.fromStatus,
    toStatus: event.toStatus,
    message: event.message,
    internal: event.internal !== false,
  });
}

export function buildAdminOrderFilter(params: {
  status?: string | null;
  q?: string | null;
  paymentMethod?: string | null;
  city?: string | null;
  from?: string | null;
  to?: string | null;
}): Record<string, unknown> {
  const filter: Record<string, unknown> = {};
  const status = params.status?.trim();
  if (status) filter.status = status as OrderStatus;

  const paymentMethod = params.paymentMethod?.trim();
  if (paymentMethod && ["prepaid", "cod", "partial"].includes(paymentMethod)) {
    filter.paymentMethod = paymentMethod;
  }

  const city = params.city?.trim();
  if (city) {
    filter["customer.city"] = new RegExp(escapeRegex(city), "i");
  }

  const from = params.from?.trim();
  const to = params.to?.trim();
  if (from || to) {
    const createdAt: Record<string, Date> = {};
    if (from) {
      const start = new Date(from);
      start.setHours(0, 0, 0, 0);
      createdAt.$gte = start;
    }
    if (to) {
      const end = new Date(to);
      end.setHours(23, 59, 59, 999);
      createdAt.$lte = end;
    }
    filter.createdAt = createdAt;
  }

  const q = params.q?.trim();
  if (q) {
    const rx = new RegExp(escapeRegex(q), "i");
    filter.$or = [
      { orderId: rx },
      { "customer.phone": rx },
      { "customer.email": rx },
      { "customer.name": rx },
      { "trackingInfo.awb": rx },
    ];
  }

  return filter;
}

export function parsePageParams(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
  const pageSize = Math.min(
    Math.max(Number(searchParams.get("limit") || "25") || 25, 1),
    100
  );
  return { page, pageSize, skip: (page - 1) * pageSize };
}
