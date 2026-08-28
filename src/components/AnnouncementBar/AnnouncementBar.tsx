"use client";

import { useSiteContent } from "@/hooks/useSiteContent";

const FALLBACK =
  "NEW ARRIVALS UPTO 40% OFF - PREPAID ORDERS DISPATCHED IN 48 HOURS - USE CODE NEW10 FOR EXTRA 10% OFF";

export const AnnouncementBar = () => {
  const siteContent = useSiteContent();
  const text = siteContent?.announcementText || FALLBACK;

  return (
    <div className="bg-[var(--color-accent)] text-[var(--color-bg)] text-center py-2 px-2 md:px-4 text-[10px] md:text-xs lg:text-sm font-normal tracking-[0.5px] lg:tracking-wide w-full">
      <p className="whitespace-normal">{text}</p>
    </div>
  );
};
