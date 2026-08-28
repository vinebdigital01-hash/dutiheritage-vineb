import { validateCouponSchema } from "@/lib/validators";
import { applyRateLimit } from "@/lib/rate-limit";
import { validateCouponCode } from "@/lib/coupons";
import { handleApiError, jsonOk, requireMongo, ApiError } from "@/lib/api";

/**
 * POST /api/coupons/validate
 * Body: { code, subtotal, productIds?, collectionIds? }
 */
export async function POST(request: Request) {
  const rateLimitRes = applyRateLimit(request, { limit: 20, windowMs: 60000 });
  if (rateLimitRes) return rateLimitRes;

  try {
    requireMongo();
    const body = await request.json(); validateCouponSchema.parse(body);
    const code = String(body.code || "");
    const subtotal = Number(body.subtotal);

    if (Number.isNaN(subtotal) || subtotal < 0) {
      throw new ApiError("subtotal is required");
    }

    const result = await validateCouponCode({
      code,
      subtotal,
      productIds: body.productIds,
      collectionIds: body.collectionIds,
    });

    return jsonOk({
      valid: true,
      ...result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
