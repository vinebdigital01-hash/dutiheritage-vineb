"use client";

import { auth } from "@/lib/firebase";

const SESSION_KEY = "duti-heritage_session_id";

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem(SESSION_KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `s_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `s_${Date.now()}`;
  }
}

export type SyncCartItem = {
  productId: string;
  size?: string;
  quantity: number;
  price?: number;
  name?: string;
  image?: string;
};

/**
 * Debounced server cart sync for abandoned-cart automations.
 */
export async function syncCartToServer(input: {
  items: SyncCartItem[];
  email?: string | null;
  phone?: string | null;
  markPurchased?: boolean;
}): Promise<void> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const user = auth.currentUser;
    if (user) {
      const token = await user.getIdToken();
      headers.Authorization = `Bearer ${token}`;
    }

    await fetch("/api/cart/sync", {
      method: "POST",
      headers,
      body: JSON.stringify({
        items: input.items,
        email: input.email || undefined,
        phone: input.phone || undefined,
        sessionId: getOrCreateSessionId(),
        markPurchased: input.markPurchased,
      }),
    });
  } catch (e) {
    console.warn("[cart-sync]", e);
  }
}
