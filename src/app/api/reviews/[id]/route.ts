import { connectDB } from "@/lib/mongodb";
import { Review } from "@/models";
import { requireAuth } from "@/lib/auth";
import { toReview } from "@/lib/reviews";
import {
  handleApiError,
  jsonOk,
  jsonError,
  requireMongo,
  ApiError,
  isValidObjectId,
} from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

/**
 * PUT /api/reviews/[id] — admin moderate (status)
 * DELETE /api/reviews/[id] — admin delete
 */
export async function PUT(request: Request, { params }: Params) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
    const { id } = await params;
    if (!isValidObjectId(id)) return jsonError("Invalid review id", 400);

    const body = await request.json();
    await connectDB();
    const review = await Review.findById(id);
    if (!review) return jsonError("Review not found", 404);

    if (body.status !== undefined) {
      if (!["approved", "pending", "rejected"].includes(body.status)) {
        throw new ApiError("Invalid status");
      }
      review.status = body.status;
    }
    if (body.comment !== undefined) review.comment = String(body.comment);
    if (body.rating !== undefined) review.rating = Number(body.rating);

    await review.save();
    return jsonOk({ review: toReview(review.toObject()) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
    const { id } = await params;
    if (!isValidObjectId(id)) return jsonError("Invalid review id", 400);

    await connectDB();
    const review = await Review.findByIdAndDelete(id);
    if (!review) return jsonError("Review not found", 404);

    return jsonOk({ deleted: true, id });
  } catch (error) {
    return handleApiError(error);
  }
}
