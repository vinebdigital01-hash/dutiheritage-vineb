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

    const updateData: Record<string, unknown> = {};

    if (body.status !== undefined) {
      if (!["approved", "pending", "rejected"].includes(body.status)) {
        throw new ApiError("Invalid status");
      }
      updateData.status = body.status;
    }
    if (body.userName !== undefined) {
      const name = String(body.userName).trim();
      if (!name) throw new ApiError("Customer name cannot be empty");
      updateData.userName = name;
    }
    if (body.comment !== undefined) {
      updateData.comment = String(body.comment).trim();
    }
    if (body.rating !== undefined) {
      const r = Number(body.rating);
      if (isNaN(r) || r < 1 || r > 5) throw new ApiError("Rating must be between 1 and 5");
      updateData.rating = r;
    }
    if (body.images !== undefined && Array.isArray(body.images)) {
      updateData.images = body.images
        .map(String)
        .map((u: string) => u.trim())
        .filter((u: string) => u.startsWith("http"))
        .slice(0, 5);
    }
    if (body.createdAt !== undefined && body.createdAt) {
      const parsedDate = new Date(body.createdAt);
      if (!isNaN(parsedDate.getTime())) {
        updateData.createdAt = parsedDate;
      }
    }
    if (body.isVerifiedPurchase !== undefined) {
      updateData.isVerifiedPurchase = Boolean(body.isVerifiedPurchase);
    }

    const updated = await Review.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, timestamps: false }
    ).lean();

    if (!updated) return jsonError("Review not found", 404);

    return jsonOk({ review: toReview(updated as any) });
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
