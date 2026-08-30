import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { Product, Coupon } from "@/models";
import { requireAuth } from "@/lib/auth";
import { toProduct } from "@/lib/mappers";
import { refreshCollectionProductCount } from "@/lib/catalog";
import {
  handleApiError,
  jsonOk,
  jsonError,
  requireMongo,
  slugify,
  ApiError,
  isValidObjectId,
} from "@/lib/api";

type Params = { params: Promise<{ id: string }> };

/**
 * GET /api/products/[id]
 * PUT /api/products/[id] (admin)
 * DELETE /api/products/[id] (admin) — soft-delete unless ?hard=1
 */
export async function GET(request: Request, { params }: Params) {
  try {
    requireMongo();
    const { id } = await params;
    if (!isValidObjectId(id)) return jsonError("Invalid product id", 400);

    await connectDB();
    const doc = await Product.findById(id).lean();
    if (!doc) return jsonError("Product not found", 404);

    // Public: only active. Admin with Bearer can load inactive for editing.
    if (doc.isActive === false) {
      try {
        await requireAuth(request, { admin: true });
      } catch {
        return jsonError("Product not found", 404);
      }
    }

    return jsonOk({ product: toProduct(doc) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
    const { id } = await params;
    if (!isValidObjectId(id)) return jsonError("Invalid product id", 400);

    await connectDB();
    const existing = await Product.findById(id);
    if (!existing) return jsonError("Product not found", 404);

    const body = await request.json();
    const prevCollectionId = existing.collectionId;

    if (body.name !== undefined) existing.name = String(body.name).trim();
    if (body.slug !== undefined) {
      const slug = slugify(String(body.slug));
      if (!slug) throw new ApiError("Invalid slug");
      existing.slug = slug;
    }
    if (body.price !== undefined) {
      const price = Number(body.price);
      if (Number.isNaN(price) || price < 0) throw new ApiError("Invalid price");
      existing.price = price;
    }
    if (body.salePrice !== undefined) existing.salePrice = body.salePrice;
    if (body.description !== undefined) existing.description = body.description;
    if (body.collectionId !== undefined) {
      existing.collectionId = String(body.collectionId);
    }
    if (body.image !== undefined) existing.image = String(body.image);
    if (body.images !== undefined) existing.images = body.images;
    if (body.sizes !== undefined) existing.sizes = body.sizes;
    if (body.colors !== undefined) existing.colors = body.colors;
    if (body.tags !== undefined) existing.tags = body.tags;
    if (body.badge !== undefined) existing.badge = body.badge;
    if (body.seoTitle !== undefined) existing.seoTitle = body.seoTitle;
    if (body.seoDescription !== undefined) {
      existing.seoDescription = body.seoDescription;
    }
    if (body.boughtLast7Days !== undefined) {
      existing.boughtLast7Days = Number(body.boughtLast7Days) || 0;
    }
    if (body.videoUrls !== undefined) existing.videoUrls = body.videoUrls;
    if (body.offers !== undefined) existing.offers = body.offers;

      // Auto-create coupons from offers
      if (body.offers && Array.isArray(body.offers)) {
        for (const offer of body.offers) {
          if (offer.code && offer.code.trim()) {
            const cCode = offer.code.toUpperCase().trim();
            const existingCoupon = await Coupon.findOne({ code: cCode });
            
            if (!existingCoupon) {
              let dType: "FLAT" | "PERCENT" = "FLAT";
              let dValue = 100; // default
              
              const desc = (offer.description || "").toLowerCase();
              const percentMatch = desc.match(/(\d+)\s*%/);
              const flatMatch = desc.match(/(?:rs\.?|₹|inr)\s*(\d+)/);
              
              if (percentMatch) {
                dType = "PERCENT";
                dValue = parseInt(percentMatch[1], 10);
              } else if (flatMatch) {
                dType = "FLAT";
                dValue = parseInt(flatMatch[1], 10);
              }

              await Coupon.create({
                code: cCode,
                discountType: dType,
                discountValue: dValue,
                scope: "SPECIFIC_PRODUCTS",
              targetIds: [existing._id.toString()],
                active: true,
                minOrderAmount: 0,
              });
            }
          }
        }
      }

    if (body.codAvailable !== undefined) existing.codAvailable = Boolean(body.codAvailable);
    if (body.isActive !== undefined) existing.isActive = Boolean(body.isActive);

    await existing.save();
    revalidatePath(`/products/${existing.slug}`);
    revalidatePath(`/`);

    await refreshCollectionProductCount(String(existing.collectionId));
    if (prevCollectionId !== existing.collectionId) {
      await refreshCollectionProductCount(String(prevCollectionId));
    }

    return jsonOk({ product: toProduct(existing.toObject()) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
    const { id } = await params;
    if (!isValidObjectId(id)) return jsonError("Invalid product id", 400);

    await connectDB();
    const existing = await Product.findById(id);
    if (!existing) return jsonError("Product not found", 404);

    const hard = new URL(request.url).searchParams.get("hard") === "1";
    const collectionId = String(existing.collectionId);

    if (hard) {
      await existing.deleteOne();
    } else {
      existing.isActive = false;
      await existing.save();
    }

    await refreshCollectionProductCount(collectionId);

    return jsonOk({
      deleted: true,
      hard,
      id,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
