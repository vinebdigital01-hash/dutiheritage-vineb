import { requireAuth } from "@/lib/auth";
import { verifyAccountMerge } from "@/lib/account-merge";
import { applyRateLimit } from "@/lib/rate-limit";
import { handleApiError, jsonOk, requireMongo, ApiError } from "@/lib/api";

/**
 * POST /api/account/merge/verify
 * Body: { otp }
 */
export async function POST(request: Request) {
  const limited = applyRateLimit(request, { limit: 10, windowMs: 60_000 });
  if (limited) return limited;

  try {
    requireMongo();
    const authUser = await requireAuth(request);
    const body = await request.json();
    const otp = String(body.otp || "").trim();
    if (!/^\d{6}$/.test(otp)) throw new ApiError("Enter the 6-digit code", 400);

    const result = await verifyAccountMerge({ authUser, otp });
    return jsonOk({
      success: true,
      ...result,
      message: "Accounts linked. Past guest orders should now show in Your orders.",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
