import { connectDB } from "@/lib/mongodb";
import { Review, Product } from "@/models";
import { requireAuth } from "@/lib/auth";
import { handleApiError, jsonOk, requireMongo, ApiError } from "@/lib/api";
import { toReview } from "@/lib/reviews";

export async function POST(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
    await connectDB();

    const body = await request.json();
    const { reviews } = body;

    if (!Array.isArray(reviews)) {
      throw new ApiError("Invalid format, expected array of reviews");
    }

    const createdReviews = [];

    for (const row of reviews) {
      const { productId, userName, rating, comment } = row;
      if (!productId || !userName || !rating || !comment) {
        continue; // Skip invalid rows
      }
      
      const numRating = Number(rating);
      if (isNaN(numRating) || numRating < 1 || numRating > 5) continue;

      const doc = await Review.create({
        productId: String(productId).trim(),
        userId: "MARKETING_REVIEW_BULK",
        userName: String(userName).trim(),
        rating: numRating,
        comment: String(comment).trim(),
        images: [],
        status: "approved",
        isVerifiedPurchase: true,
      });

      createdReviews.push(toReview(doc.toObject()));
    }

    return jsonOk({ 
      success: true, 
      count: createdReviews.length,
      message: `Successfully imported ${createdReviews.length} reviews.`
    });
  } catch (error) {
    return handleApiError(error);
  }
}
