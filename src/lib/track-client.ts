"use client";

import { auth } from "@/lib/firebase";
import { getOrCreateSessionId } from "@/lib/cart-client";

const SESSION_FBCLID = "duti-heritage_fbclid";

export type TrackPayload = {
  event: string;
  productId?: string;
  productName?: string;
  collectionId?: string;
  path?: string;
  metadata?: Record<string, unknown>;
  durationMs?: number;
};

function captureFbclid(): string | undefined {
  if (typeof window === "undefined") return undefined;
  try {
    const existing = localStorage.getItem(SESSION_FBCLID);
    if (existing) return existing;
    const params = new URLSearchParams(window.location.search);
    const fbclid = params.get("fbclid");
    if (fbclid) {
      localStorage.setItem(SESSION_FBCLID, fbclid);
      return fbclid;
    }
  } catch {}
  return undefined;
}

let queue: TrackPayload[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;

async function flushEvents() {
  if (queue.length === 0) return;
  const batch = queue.splice(0, 20);
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      headers.Authorization = `Bearer ${token}`;
    }

    await fetch("/api/track", {
      method: "POST",
      headers,
      body: JSON.stringify({
        events: batch,
        sessionId: getOrCreateSessionId(),
        fbclid: captureFbclid(),
        path: typeof window !== "undefined" ? window.location.pathname : undefined,
        referrer:
          typeof document !== "undefined" ? document.referrer || undefined : undefined,
      }),
    });
  } catch {
    // non-blocking analytics
  }
}

/** Fire-and-forget event tracking (batched). */
export function trackEvent(payload: TrackPayload) {
  if (typeof window === "undefined") return;
  queue.push({
    ...payload,
    path: payload.path || window.location.pathname,
  });
  if (flushTimer) clearTimeout(flushTimer);
  flushTimer = setTimeout(() => {
    flushTimer = null;
    void flushEvents();
  }, 400);
}

/** Track time spent on a page; call returned fn on unmount. */
export function trackPageDuration(event: string, meta?: Record<string, unknown>) {
  const start = Date.now();
  return () => {
    trackEvent({
      event,
      durationMs: Date.now() - start,
      metadata: meta,
    });
  };
}
