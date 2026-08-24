import { connectDB } from "@/lib/mongodb";
import { Coupon } from "@/models";
import { requireAuth } from "@/lib/auth";
import { toCoupon, toPublicCoupon } from "@/lib/coupons";
import {
  handleApiError,
  jsonOk,
  jsonCreated,
  requireMongo,
  ApiError,
} from "@/lib/api";

/**
 * GET /api/coupons
 *  - ?public=1 → active coupons (safe fields for checkout UI)
 *  - default → admin full list
 * POST /api/coupons (admin)
 */
export async function GET(request: Request) {
  try {
    requireMongo();
    await connectDB();

    const { searchParams } = new URL(request.url);
    const isPublic = searchParams.get("public") === "1";

    if (isPublic) {
      const docs = await Coupon.find({ active: true })
        .sort({ createdAt: -1 })
        .lean();
      const now = new Date();
      const coupons = docs
        .filter((c) => !c.expiresAt || new Date(c.expiresAt) >= now)
        .map((c) => toPublicCoupon(c));
      return jsonOk({ coupons, count: coupons.length });
    }

    await requireAuth(request, { admin: true });
    const docs = await Coupon.find({}).sort({ createdAt: -1 }).lean();
    return jsonOk({
      coupons: docs.map((c) => toCoupon(c)),
      count: docs.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
    await connectDB();

    const body = await request.json();
    const code = String(body.code || "")
      .trim()
      .toUpperCase();
    if (!code) throw new ApiError("code is required");

    const discountType = body.discountType as "PERCENT" | "FLAT";
    if (!["PERCENT", "FLAT"].includes(discountType)) {
      throw new ApiError("discountType must be PERCENT or FLAT");
    }

    const discountValue = Number(body.discountValue);
    if (Number.isNaN(discountValue) || discountValue < 0) {
      throw new ApiError("Valid discountValue is required");
    }

    const existing = await Coupon.findOne({ code });
    if (existing) throw new ApiError("Coupon code already exists", 409);

    const doc = await Coupon.create({
      code,
      discountType,
      discountValue,
      scope: body.scope || "ALL_PRODUCTS",
      targetIds: body.targetIds ?? [],
      usageLimit: body.usageLimit,
      perUserLimit: body.perUserLimit,
      minOrderAmount: body.minOrderAmount ?? 0,
      usedCount: 0,
      active: body.active !== false,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : undefined,
    });

    return jsonCreated({ coupon: toCoupon(doc.toObject()) });
  } catch (error) {
    return handleApiError(error);
  }
}
