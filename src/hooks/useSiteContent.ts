"use client";

import { useEffect, useState } from "react";
import type { SiteContentData } from "@/lib/site-content-server";

let cache: SiteContentData | null = null;
let pending: Promise<SiteContentData | null> | null = null;

export function useSiteContent() {
  const [content, setContent] = useState<SiteContentData | null>(cache);

  useEffect(() => {
    if (cache) {
      setContent(cache);
      return;
    }
    if (!pending) {
      pending = fetch("/api/site-content")
        .then((r) => (r.ok ? r.json() : null))
        .then((data) => {
          cache = data?.content ?? null;
          return cache;
        })
        .catch(() => null)
        .finally(() => {
          pending = null;
        });
    }
    pending.then((c) => setContent(c));
  }, []);

  return content;
}
