import { requireAuth } from "@/lib/auth";
import { startAccountMerge } from "@/lib/account-merge";
import { applyRateLimit } from "@/lib/rate-limit";
import { handleApiError, jsonOk, requireMongo, ApiError } from "@/lib/api";

/**
 * POST /api/account/merge/send
 * Body: { target, type: "email" | "phone" }
 */
export async function POST(request: Request) {
  const limited = applyRateLimit(request, { limit: 5, windowMs: 60_000 });
  if (limited) return limited;

  try {
    requireMongo();
    const authUser = await requireAuth(request);
    const body = await request.json();
    const type = body.type === "phone" ? "phone" : "email";
    const target = String(body.target || "").trim();
    if (!target) throw new ApiError("Enter an email or phone to link", 400);

    const result = await startAccountMerge({ authUser, target, type });
    return jsonOk({
      success: true,
      masked: result.masked,
      message:
        type === "email"
          ? `We sent a 6-digit code to ${result.masked}`
          : `We sent a WhatsApp code to ${result.masked}`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
