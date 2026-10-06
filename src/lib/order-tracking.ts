/** Shared UI helpers for order tracking display. */

export function resolveTrackingUrl(
  trackingUrl: string | null | undefined,
  orderId: string
): string {
  const raw = String(trackingUrl || "").trim();
  if (raw) {
    return raw.startsWith("http") ? raw : `https://${raw}`;
  }
  return `/track?orderId=${encodeURIComponent(orderId)}`;
}

export function hasTrackingNumber(tracking?: {
  awb?: string | null;
} | null): boolean {
  return Boolean(tracking?.awb && String(tracking.awb).trim());
}
