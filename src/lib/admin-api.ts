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
  const headers = await authHeaders();
  const res = await fetch(path, {
    ...init,
    headers: {
      ...headers,
      ...(init?.headers || {}),
    },
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AdminApiError(
      (data as { error?: string }).error || `Request failed (${res.status})`,
      res.status
    );
  }
  return data as T;
}
