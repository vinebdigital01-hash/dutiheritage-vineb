"use client";

import { hasTrackingNumber, resolveTrackingUrl } from "@/lib/order-tracking";

type Tracking = {
  awb?: string;
  courier?: string;
  trackingUrl?: string;
} | null | undefined;

export function OrderTrackingBlock({
  orderId,
  tracking,
  className = "",
}: {
  orderId: string;
  tracking: Tracking;
  className?: string;
}) {
  if (!hasTrackingNumber(tracking)) return null;

  const href = resolveTrackingUrl(tracking?.trackingUrl, orderId);
  const external = href.startsWith("http");

  return (
    <div className={`text-[13px] ${className}`}>
      <p className="text-[11px] uppercase tracking-wider text-gray-500 mb-1">
        Tracking
      </p>
      <p>
        {tracking?.courier ? `${tracking.courier} · ` : ""}
        <span className="font-mono font-medium">{tracking?.awb}</span>
        {" · "}
        <a
          href={href}
          {...(external
            ? { target: "_blank", rel: "noopener noreferrer" }
            : {})}
          className="underline underline-offset-2 font-medium"
        >
          Track
        </a>
      </p>
    </div>
  );
}
