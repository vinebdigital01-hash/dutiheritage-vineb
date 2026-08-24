"use client";

import React, { useEffect, useState } from "react";

const FALLBACK =
  "NEW ARRIVALS UPTO 40% OFF - PREPAID ORDERS DISPATCHED IN 48 HOURS - USE CODE NEW10 FOR EXTRA 10% OFF";

export const AnnouncementBar = () => {
  const [text, setText] = useState(FALLBACK);

  useEffect(() => {
    fetch("/api/site-content")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.content?.announcementText) {
          setText(data.content.announcementText);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className="bg-[var(--color-accent)] text-[var(--color-bg)] text-center py-2 px-2 md:px-4 text-[10px] md:text-xs lg:text-sm font-normal tracking-[0.5px] lg:tracking-wide w-full">
      <p className="whitespace-normal">{text}</p>
    </div>
  );
};
