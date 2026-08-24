import { requireAuth } from "@/lib/auth";
import { getAnalyticsSummary } from "@/lib/analytics";
import { handleApiError, jsonOk, requireMongo } from "@/lib/api";

/**
 * GET /api/analytics?days=30 — admin dashboard metrics
 */
export async function GET(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });

    const days = Math.min(
      Math.max(Number(new URL(request.url).searchParams.get("days") || "30"), 1),
      90
    );

    const summary = await getAnalyticsSummary(days);
    return jsonOk(summary);
  } catch (error) {
    return handleApiError(error);
  }
}
