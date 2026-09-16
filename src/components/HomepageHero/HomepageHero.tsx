"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { HeroBanner } from "@/lib/site-content-shared";
import { isHeroBannerLive } from "@/lib/site-content-shared";

export function HomepageHero({ banners }: { banners: HeroBanner[] }) {
  const live = useMemo(
    () => banners.filter((b) => isHeroBannerLive(b)),
    [banners]
  );
  const [idx, setIdx] = useState(0);
  if (!live.length) return null;

  const current = live[Math.min(idx, live.length - 1)]!;
  const href = current.href || "#";

  return (
    <section className="relative w-full bg-neutral-100 mb-8">
      <Link href={href === "#" ? "/" : href} className="block relative aspect-[16/7] min-h-[220px] md:min-h-[360px] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.image}
          alt={current.headline || "Banner"}
          className="absolute inset-0 w-full h-full object-cover"
        />
        {(current.headline || current.subtext) && (
          <div className="absolute inset-0 bg-black/25 flex flex-col items-center justify-center text-center px-6 text-white">
            {current.headline ? (
              <h2 className="text-2xl md:text-4xl font-serif tracking-[2px] uppercase mb-2">
                {current.headline}
              </h2>
            ) : null}
            {current.subtext ? (
              <p className="text-sm md:text-base max-w-xl">{current.subtext}</p>
            ) : null}
          </div>
        )}
      </Link>
      {live.length > 1 ? (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
          {live.map((b, i) => (
            <button
              key={b.id || b.image + i}
              type="button"
              aria-label={`Banner ${i + 1}`}
              onClick={() => setIdx(i)}
              className={`w-2.5 h-2.5 rounded-full ${i === idx ? "bg-white" : "bg-white/50"}`}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}
