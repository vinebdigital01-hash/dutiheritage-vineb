import { requireAuth } from "@/lib/auth";
import { checkReviewEligibility } from "@/lib/reviews";
import {
  handleApiError,
  jsonOk,
  requireMongo,
  ApiError,
} from "@/lib/api";

/**
 * GET /api/reviews/eligibility?productId=
 * Auth required.
 */
export async function GET(request: Request) {
  try {
    requireMongo();
    const authUser = await requireAuth(request);
    const productId = new URL(request.url).searchParams.get("productId");
    if (!productId) throw new ApiError("productId is required");

    const result = await checkReviewEligibility({
      productId,
      firebaseUid: authUser.uid,
      email: authUser.email,
    });

    return jsonOk(result);
  } catch (error) {
    return handleApiError(error);
  }
}
