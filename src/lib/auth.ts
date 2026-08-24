import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type DecodedIdToken } from "firebase-admin/auth";

function getAdminApp(): App {
  if (getApps().length) {
    return getApps()[0]!;
  }

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    const serviceAccount = JSON.parse(json) as {
      project_id: string;
      client_email: string;
      private_key: string;
    };
    return initializeApp({
      credential: cert({
        projectId: serviceAccount.project_id,
        clientEmail: serviceAccount.client_email,
        privateKey: serviceAccount.private_key.replace(/\\n/g, "\n"),
      }),
    });
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(
    /\\n/g,
    "\n"
  );

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_ADMIN_* in .env.local."
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

export type AuthUser = {
  uid: string;
  email: string | null;
  name: string | null;
  token: DecodedIdToken;
};

function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return getAdminEmails().includes(email.toLowerCase());
}

/**
 * Verify a Firebase ID token from the Authorization: Bearer <token> header.
 */
export async function verifyIdToken(
  authorizationHeader: string | null
): Promise<AuthUser> {
  if (!authorizationHeader?.startsWith("Bearer ")) {
    throw new AuthError("Missing or invalid Authorization header", 401);
  }

  const idToken = authorizationHeader.slice("Bearer ".length).trim();
  if (!idToken) {
    throw new AuthError("Missing ID token", 401);
  }

  try {
    const decoded = await getAuth(getAdminApp()).verifyIdToken(idToken);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: decoded.name ?? null,
      token: decoded,
    };
  } catch {
    throw new AuthError("Invalid or expired ID token", 401);
  }
}

/**
 * Require a valid Firebase user. Optionally require admin email.
 */
export async function requireAuth(
  request: Request,
  options?: { admin?: boolean }
): Promise<AuthUser> {
  const user = await verifyIdToken(request.headers.get("authorization"));

  if (options?.admin && !isAdminEmail(user.email)) {
    throw new AuthError("Admin access required", 403);
  }

  return user;
}

/**
 * Protect cron / internal routes with CRON_SECRET.
 */
export function requireCronSecret(request: Request): void {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    throw new AuthError("CRON_SECRET is not configured", 500);
  }

  const header = request.headers.get("authorization");
  if (header !== `Bearer ${secret}`) {
    throw new AuthError("Unauthorized cron request", 401);
  }
}

export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AuthError";
    this.status = status;
  }
}

export function authErrorResponse(error: unknown): Response {
  if (error instanceof AuthError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  console.error("[auth]", error);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
