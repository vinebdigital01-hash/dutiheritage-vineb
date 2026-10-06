import { connectDB } from "@/lib/mongodb";
import { Coupon } from "@/models";
import { requireAuth } from "@/lib/auth";
import { CATALOG_WRITE } from "@/lib/rbac";
import { toCoupon, parseCouponLimit } from "@/lib/coupons";
import { endOfIstCalendarDay } from "@/lib/india-time";
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
    await requireAuth(request, { admin: true, roles: CATALOG_WRITE });
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
      if (!["PERCENT", "FLAT", "BUY_X_PERCENT", "BUY_X_GET_Y_FREE"].includes(body.discountType)) {
        throw new ApiError("Invalid discountType");
      }
      coupon.discountType = body.discountType;
    }
    if (body.discountValue !== undefined) {
      coupon.discountValue = Number(body.discountValue);
    }
    if (body.scope !== undefined) coupon.scope = body.scope;
    if (body.targetIds !== undefined) coupon.targetIds = body.targetIds;
    if (body.minQuantity !== undefined) coupon.minQuantity = Number(body.minQuantity) || 0;
    if (body.freeQuantity !== undefined) coupon.freeQuantity = Number(body.freeQuantity) || 0;
    if (body.usageLimit !== undefined) {
      coupon.usageLimit = parseCouponLimit(body.usageLimit);
    }
    if (body.perUserLimit !== undefined) {
      coupon.perUserLimit = parseCouponLimit(body.perUserLimit);
    }
    if (body.minOrderAmount !== undefined) {
      coupon.minOrderAmount = Number(body.minOrderAmount) || 0;
    }
    if (body.active !== undefined) coupon.active = Boolean(body.active);
    if (body.expiresAt !== undefined) {
      coupon.expiresAt = endOfIstCalendarDay(body.expiresAt);
    }

    await coupon.save();

    const unset: Record<string, 1> = {};
    if (body.usageLimit !== undefined && parseCouponLimit(body.usageLimit) === undefined) {
      unset.usageLimit = 1;
    }
    if (body.perUserLimit !== undefined && parseCouponLimit(body.perUserLimit) === undefined) {
      unset.perUserLimit = 1;
    }
    if (body.expiresAt !== undefined && !endOfIstCalendarDay(body.expiresAt)) {
      unset.expiresAt = 1;
    }
    if (Object.keys(unset).length > 0) {
      await Coupon.updateOne({ _id: coupon._id }, { $unset: unset });
      const fresh = await Coupon.findById(coupon._id);
      if (fresh) return jsonOk({ coupon: toCoupon(fresh.toObject()) });
    }

    return jsonOk({ coupon: toCoupon(coupon.toObject()) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true, roles: CATALOG_WRITE });
    const { id } = await params;
    if (!isValidObjectId(id)) return jsonError("Invalid coupon id", 400);

    await connectDB();
    await Coupon.findByIdAndDelete(id);

    return jsonOk({ deleted: true, id });
  } catch (error) {
    return handleApiError(error);
  }
}
