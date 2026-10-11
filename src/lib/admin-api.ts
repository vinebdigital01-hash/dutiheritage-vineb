"use client";

import { authHeaders } from "@/lib/checkout-client";

export class AdminApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function adminFetch<T = unknown>(
  path: string,
  init?: RequestInit
): Promise<T> {
  let headers = await authHeaders();
  let res = await fetch(path, {
    ...init,
    headers: {
      ...headers,
      ...(init?.headers || {}),
    },
  });

  // If 401, retry once after refreshing auth token (prevents stale token / hydration race conditions)
  if (res.status === 401) {
    try {
      const { auth } = await import("@/lib/firebase");
      if (typeof auth.authStateReady === "function") {
        await auth.authStateReady();
      }
      if (auth.currentUser) {
        const freshToken = await auth.currentUser.getIdToken(true);
        const retryHeaders = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${freshToken}`,
        };
        res = await fetch(path, {
          ...init,
          headers: {
            ...retryHeaders,
            ...(init?.headers || {}),
          },
        });
      }
    } catch {
      /* ignore retry error and handle original response */
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AdminApiError(
      (data as { error?: string }).error || `Request failed (${res.status})`,
      res.status
    );
  }
  return data as T;
}

export async function downloadAdminFile(path: string, filename: string) {
  const headers = await authHeaders();
  const res = await fetch(path, { headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new AdminApiError(
      (data as { error?: string }).error || `Download failed (${res.status})`,
      res.status
    );
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
