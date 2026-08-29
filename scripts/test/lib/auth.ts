import { firebaseApiKey, loadTestEnv } from "./env";

export type AuthTokens = {
  idToken: string;
  refreshToken: string;
  localId: string;
  email: string;
};

export async function signInWithPassword(
  email: string,
  password: string
): Promise<AuthTokens> {
  loadTestEnv();
  const key = firebaseApiKey();
  const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${key}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true,
    }),
  });
  const data = (await res.json()) as {
    idToken?: string;
    refreshToken?: string;
    localId?: string;
    email?: string;
    error?: { message?: string };
  };
  if (!res.ok || !data.idToken) {
    throw new Error(
      `Firebase sign-in failed for ${email}: ${data.error?.message || res.status}`
    );
  }
  return {
    idToken: data.idToken,
    refreshToken: data.refreshToken || "",
    localId: data.localId || "",
    email: data.email || email,
  };
}

export async function getAdminToken(): Promise<AuthTokens | null> {
  loadTestEnv();
  const email = process.env.TEST_ADMIN_EMAIL?.trim();
  const password = process.env.TEST_ADMIN_PASSWORD;
  if (!email || !password) return null;
  return signInWithPassword(email, password);
}

export async function getCustomerToken(): Promise<AuthTokens | null> {
  loadTestEnv();
  const email = process.env.TEST_CUSTOMER_EMAIL?.trim();
  const password = process.env.TEST_CUSTOMER_PASSWORD;
  if (!email || !password) return null;
  return signInWithPassword(email, password);
}
