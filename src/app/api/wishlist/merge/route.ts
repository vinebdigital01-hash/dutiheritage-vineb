import { connectDB } from "@/lib/mongodb";
import { Wishlist } from "@/models";
import { requireAuth } from "@/lib/auth";
import { handleApiError, jsonOk, requireMongo, ApiError } from "@/lib/api";

/**
 * POST /api/wishlist/merge
 * Add guest LocalStorage IDs without toggling off existing server rows.
 */
export async function POST(request: Request) {
  try {
    requireMongo();
    const auth = await requireAuth(request);
    const body = await request.json();
    const raw = Array.isArray(body.productIds) ? body.productIds : [];
    const productIds = [
      ...new Set(raw.map((id: unknown) => String(id || "").trim()).filter(Boolean)),
    ].slice(0, 50);

    if (productIds.length === 0) {
      throw new ApiError("productIds required", 400);
    }

    await connectDB();
    const existing = await Wishlist.find({
      firebaseUid: auth.uid,
      productId: { $in: productIds },
    }).lean();
    const have = new Set(existing.map((w) => String(w.productId)));
    const toInsert = productIds.filter((id) => !have.has(id));

    if (toInsert.length > 0) {
      await Wishlist.insertMany(
        toInsert.map((productId) => ({
          firebaseUid: auth.uid,
          email: auth.email,
          productId,
        })),
        { ordered: false }
      ).catch(() => {
        /* unique index may race */
      });
    }

    const all = await Wishlist.find({ firebaseUid: auth.uid }).lean();
    return jsonOk({
      productIds: all.map((w) => String(w.productId)),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
