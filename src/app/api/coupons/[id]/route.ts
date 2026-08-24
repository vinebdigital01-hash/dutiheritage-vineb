import { connectDB } from "@/lib/mongodb";
import { Coupon } from "@/models";
import { requireAuth } from "@/lib/auth";
import { toCoupon } from "@/lib/coupons";
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
 * PUT /api/coupons/[id] (admin)
 * DELETE /api/coupons/[id] (admin)
 */
export async function PUT(request: Request, { params }: Params) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
    const { id } = await params;
    if (!isValidObjectId(id)) return jsonError("Invalid coupon id", 400);

    await connectDB();
    const coupon = await Coupon.findById(id);
    if (!coupon) return jsonError("Coupon not found", 404);

    const body = await request.json();

    if (body.code !== undefined) {
      coupon.code = String(body.code).trim().toUpperCase();
    }
    if (body.discountType !== undefined) {
      if (!["PERCENT", "FLAT"].includes(body.discountType)) {
        throw new ApiError("discountType must be PERCENT or FLAT");
      }
      coupon.discountType = body.discountType;
    }
    if (body.discountValue !== undefined) {
      coupon.discountValue = Number(body.discountValue);
    }
    if (body.scope !== undefined) coupon.scope = body.scope;
    if (body.targetIds !== undefined) coupon.targetIds = body.targetIds;
    if (body.usageLimit !== undefined) coupon.usageLimit = body.usageLimit;
    if (body.perUserLimit !== undefined) coupon.perUserLimit = body.perUserLimit;
    if (body.minOrderAmount !== undefined) {
      coupon.minOrderAmount = Number(body.minOrderAmount) || 0;
    }
    if (body.active !== undefined) coupon.active = Boolean(body.active);
    if (body.expiresAt !== undefined) {
      coupon.expiresAt = body.expiresAt ? new Date(body.expiresAt) : undefined;
    }

    await coupon.save();
    return jsonOk({ coupon: toCoupon(coupon.toObject()) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
    const { id } = await params;
    if (!isValidObjectId(id)) return jsonError("Invalid coupon id", 400);

    await connectDB();
    const coupon = await Coupon.findById(id);
    if (!coupon) return jsonError("Coupon not found", 404);

    // Soft-deactivate by default
    coupon.active = false;
    await coupon.save();

    return jsonOk({ deleted: true, id, soft: true });
  } catch (error) {
    return handleApiError(error);
  }
}
