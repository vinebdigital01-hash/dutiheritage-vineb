"use client";

import type { User } from "firebase/auth";
import type { UserProfile } from "@/types";

export type SyncResult = {
  profile: UserProfile | null;
  isAdmin: boolean;
  adminRole?: string | null;
  customerId?: string;
};

/**
 * Sync the current Firebase user into MongoDB via /api/auth/sync.
 * Soft-fails (returns null profile) if backend/Mongo is unavailable.
 */
export async function syncAuthToBackend(
  firebaseUser: User
): Promise<SyncResult> {
  try {
    const token = await firebaseUser.getIdToken();
    const res = await fetch("/api/auth/sync", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: firebaseUser.displayName,
        email: firebaseUser.email,
        phone: firebaseUser.phoneNumber,
      }),
    });

    if (!res.ok) {
      console.warn("[auth-sync] failed:", res.status, await res.text());
      return { profile: null, isAdmin: false, adminRole: null };
    }

    const data = (await res.json()) as {
      profile?: UserProfile;
      isAdmin?: boolean;
      adminRole?: string | null;
      customer?: { id?: string };
    };

    return {
      profile: data.profile ?? null,
      isAdmin: Boolean(data.isAdmin),
      adminRole: data.adminRole || null,
      customerId: data.customer?.id,
    };
  } catch (error) {
    console.warn("[auth-sync] error:", error);
    return { profile: null, isAdmin: false, adminRole: null };
  }
}

/**
 * Check whether an email exists in Mongo before sending reset / magic link.
 */
export async function checkEmailExists(email: string): Promise<{
  exists: boolean;
  skipped?: boolean;
}> {
  const res = await fetch("/api/auth/check-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  if (!res.ok) {
    throw new Error("Could not verify email. Please try again.");
  }

  return res.json();
}
