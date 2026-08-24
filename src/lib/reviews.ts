import { connectDB } from "@/lib/mongodb";
import { Order, Review } from "@/models";
import { isAdminEmail } from "@/lib/auth";
import { ApiError } from "@/lib/api";

export type ReviewDTO = {
  id: string;
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment: string;
  images: string[];
  status: "approved" | "pending" | "rejected";
  isVerifiedPurchase: boolean;
  orderId?: string | null;
  createdAt?: string;
};

type LeanReview = {
  _id: { toString(): string };
  productId: string;
  userId: string;
  userName: string;
  rating: number;
  comment?: string;
  images?: string[];
  status: string;
  isVerifiedPurchase?: boolean;
  orderId?: string | null;
  createdAt?: Date | string;
};

export function toReview(doc: LeanReview): ReviewDTO {
  return {
    id: doc._id.toString(),
    productId: doc.productId,
    userId: doc.userId,
    userName: doc.userName,
    rating: doc.rating,
    comment: doc.comment || "",
    images: doc.images || [],
    status: doc.status as ReviewDTO["status"],
    isVerifiedPurchase: Boolean(doc.isVerifiedPurchase),
    orderId: doc.orderId ?? null,
    createdAt: doc.createdAt
      ? new Date(doc.createdAt).toISOString()
      : undefined,
  };
}

/**
 * Eligible if user has a Delivered order containing this productId.
 * Admins are always eligible (moderation / marketing).
 */
export async function checkReviewEligibility(input: {
  productId: string;
  firebaseUid: string;
  email?: string | null;
}): Promise<{
  eligible: boolean;
  reason?: string;
  orderId?: string;
  isAdmin?: boolean;
}> {
  await connectDB();

  if (isAdminEmail(input.email)) {
    return { eligible: true, isAdmin: true };
  }

  const order = await Order.findOne({
    firebaseUid: input.firebaseUid,
    status: "Delivered",
    "items.productId": input.productId,
  })
    .sort({ createdAt: -1 })
    .lean();

  if (!order) {
    return {
      eligible: false,
      reason:
        "Only customers who have received this product can write a review.",
    };
  }

  const existing = await Review.findOne({
    productId: input.productId,
    userId: input.firebaseUid,
  }).lean();

  if (existing) {
    return {
      eligible: false,
      reason: "You have already reviewed this product.",
      orderId: order.orderId,
    };
  }

  return {
    eligible: true,
    orderId: order.orderId,
    isAdmin: false,
  };
}

export async function assertCanReview(input: {
  productId: string;
  firebaseUid: string;
  email?: string | null;
}) {
  const result = await checkReviewEligibility(input);
  if (!result.eligible) {
    throw new ApiError(result.reason || "Not eligible to review", 403);
  }
  return result;
}
