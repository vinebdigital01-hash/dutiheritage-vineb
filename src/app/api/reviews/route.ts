import { connectDB } from "@/lib/mongodb";
import { Review } from "@/models";
import { requireAuth, isAdminEmail } from "@/lib/auth";
import {
  assertCanReview,
  toReview,
} from "@/lib/reviews";
import {
  handleApiError,
  jsonOk,
  jsonCreated,
  requireMongo,
  ApiError,
} from "@/lib/api";

/**
 * GET /api/reviews?productId=
 *  - Public: approved reviews for a product
 *  - Admin + ?all=1: all statuses
 *
 * POST /api/reviews
 *  - Auth required; verified purchase (Delivered) unless admin
 */
export async function GET(request: Request) {
  try {
    requireMongo();
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get("productId");
    const all = searchParams.get("all") === "1";

    if (!productId && !all) {
      throw new ApiError("productId is required");
    }

    await connectDB();

    if (all) {
      await requireAuth(request, { admin: true });
      const filter: Record<string, unknown> = {};
      if (productId) filter.productId = productId;
      const status = searchParams.get("status");
      if (status) filter.status = status;
      const docs = await Review.find(filter).sort({ createdAt: -1 }).limit(200).lean();
      return jsonOk({
        reviews: docs.map((d) => toReview(d)),
        count: docs.length,
      });
    }

    const docs = await Review.find({
      productId,
      status: "approved",
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const ratings = docs.map((d) => d.rating);
    const avg =
      ratings.length > 0
        ? Math.round(
            (ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10
          ) / 10
        : 0;

    return jsonOk({
      reviews: docs.map((d) => toReview(d)),
      count: docs.length,
      averageRating: avg,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    requireMongo();
    const authUser = await requireAuth(request);
    await connectDB();

    const body = await request.json();
    const productId = String(body.productId || "").trim();
    const rating = Number(body.rating);
    const comment = String(body.comment || "").trim();
    const images = Array.isArray(body.images) ? body.images.map(String) : [];

    if (!productId) throw new ApiError("productId is required");
    if (!rating || rating < 1 || rating > 5) {
      throw new ApiError("rating must be 1–5");
    }

    const eligibility = await assertCanReview({
      productId,
      firebaseUid: authUser.uid,
      email: authUser.email,
    });

    const isAdmin = isAdminEmail(authUser.email);
    const doc = await Review.create({
      productId,
      userId: isAdmin && body.isMarketing ? "MARKETING_REVIEW" : authUser.uid,
      userName: (isAdmin && body.userName) 
        ? String(body.userName).trim() 
        : (authUser.name || authUser.email?.split("@")[0] || "Customer"),
      rating,
      comment,
      images,
      status: isAdmin ? "approved" : "pending",
      isVerifiedPurchase: (isAdmin && body.isMarketing) ? true : !eligibility.isAdmin,
      orderId: eligibility.orderId,
    });

    return jsonCreated({
      review: toReview(doc.toObject()),
      message: isAdmin
        ? "Review published"
        : "Review submitted for moderation",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
