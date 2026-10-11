import { connectDB } from "@/lib/mongodb";
import { Coupon, Customer } from "@/models";
import { requireAuth, verifyIdToken } from "@/lib/auth";
import { CATALOG_WRITE } from "@/lib/rbac";
import { toCoupon, toPublicCoupon, parseCouponLimit } from "@/lib/coupons";
import { endOfIstCalendarDay } from "@/lib/india-time";
import {
  handleApiError,
  jsonOk,
  jsonCreated,
  requireMongo,
  ApiError,
} from "@/lib/api";

/**
 * GET /api/coupons
 *  - ?public=1 → active coupons (safe fields for checkout UI, filtered to user)
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
      let customerPhone = searchParams.get("phone") || "";

      // Also try to read phone from Authorization header if present
      const authHeader = request.headers.get("authorization");
      if (!customerPhone && authHeader) {
        try {
          const authUser = await verifyIdToken(authHeader);
          const rawPhone =
            (authUser.token as any)?.phone_number || (authUser as any).phone;
          if (rawPhone) {
            customerPhone = String(rawPhone);
          } else if (authUser?.uid) {
            const customerDoc = await Customer.findOne({
              $or: [
                { firebaseUid: authUser.uid },
                ...(authUser.email ? [{ email: authUser.email.toLowerCase() }] : []),
              ],
            }).lean();
            if (customerDoc?.phone) {
              customerPhone = customerDoc.phone;
            }
          }
        } catch {
          // guest or unauthenticated
        }
      }

      const phoneClean = String(customerPhone || "").replace(/\D/g, "");
      const phoneLast10 = phoneClean.length >= 10 ? phoneClean.slice(-10) : "";

      const docs = await Coupon.find({ active: true })
        .sort({ createdAt: -1 })
        .lean();
      const now = new Date();

      const filtered = docs.filter((c) => {
        // Expiry check
        if (c.expiresAt && new Date(c.expiresAt) < now) return false;

        // Usage limit check
        if (c.usageLimit != null && (c.usedCount ?? 0) >= c.usageLimit) return false;

        // Secret coupon: never show in public listings
        if ((c as any).isSecret) return false;

        // Personalised check: if coupon is restricted to a phone, ONLY show if requesting user matches!
        const restricted = String((c as any).restrictedToPhone || "").replace(/\D/g, "");
        const restrictedLast10 = restricted.length >= 10 ? restricted.slice(-10) : restricted;

        if (restrictedLast10) {
          if (!phoneLast10 || phoneLast10 !== restrictedLast10) {
            return false;
          }
        }

        return true;
      });

      const coupons = filtered.map((c) => toPublicCoupon(c));
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
    await requireAuth(request, { admin: true, roles: CATALOG_WRITE });
    await connectDB();

    const body = await request.json();
    const code = String(body.code || "")
      .trim()
      .toUpperCase();
    if (!code) throw new ApiError("code is required");

    const discountType = body.discountType;
    if (!["PERCENT", "FLAT", "BUY_X_PERCENT", "BUY_X_GET_Y_FREE"].includes(discountType)) {
      throw new ApiError("Invalid discountType");
    }

    const discountValue = Number(body.discountValue) || 0;
    const minQuantity = Number(body.minQuantity) || 0;
    const freeQuantity = Number(body.freeQuantity) || 0;

    const existing = await Coupon.findOne({ code });
    if (existing) throw new ApiError("Coupon code already exists", 409);

    const doc = await Coupon.create({
      code,
      discountType,
      discountValue,
      minQuantity,
      freeQuantity,
      scope: body.scope || "ALL_PRODUCTS",
      targetIds: body.targetIds ?? [],
      usageLimit: parseCouponLimit(body.usageLimit),
      perUserLimit: parseCouponLimit(body.perUserLimit),
      minOrderAmount: body.minOrderAmount ?? 0,
      usedCount: 0,
      active: body.active !== false,
      expiresAt: endOfIstCalendarDay(body.expiresAt),
      restrictedToPhone: String(body.restrictedToPhone || "").trim(),
      isSecret: Boolean(body.isSecret),
    });

    return jsonCreated({ coupon: toCoupon(doc.toObject()) });
  } catch (error) {
    return handleApiError(error);
  }
}
