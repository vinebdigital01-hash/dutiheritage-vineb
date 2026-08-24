import { validateCouponCode } from "@/lib/coupons";
import { handleApiError, jsonOk, requireMongo, ApiError } from "@/lib/api";

/**
 * POST /api/coupons/validate
 * Body: { code, subtotal, productIds?, collectionIds? }
 */
export async function POST(request: Request) {
  try {
    requireMongo();
    const body = await request.json();
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
