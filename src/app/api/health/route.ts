import { connectDB } from "@/lib/mongodb";
import { handleApiError, jsonOk } from "@/lib/api";

/**
 * GET /api/health — connectivity smoke test for Phase 0.
 * Does not require auth. Safe to hit locally after setting MONGODB_URI.
 */
export async function GET() {
  try {
    if (!process.env.MONGODB_URI) {
      return jsonOk({
        ok: false,
        mongodb: "not_configured",
        message: "Set MONGODB_URI in .env.local (see .env.example).",
      });
    }

    await connectDB();

    return jsonOk({
      ok: true,
      mongodb: "connected",
      adminEmailsConfigured: Boolean(process.env.ADMIN_EMAILS?.trim()),
      firebaseAdminConfigured: Boolean(
        process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
          (process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
            process.env.FIREBASE_ADMIN_PRIVATE_KEY)
      ),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
