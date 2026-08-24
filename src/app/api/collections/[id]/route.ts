import { connectDB } from "@/lib/mongodb";
import { Collection, Product } from "@/models";
import { requireAuth } from "@/lib/auth";
import { toCollection } from "@/lib/mappers";
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
 * GET /api/collections/[id]
 * PUT /api/collections/[id] (admin)
 * DELETE /api/collections/[id] (admin) — soft-delete unless ?hard=1
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    requireMongo();
    const { id } = await params;
    if (!isValidObjectId(id)) return jsonError("Invalid collection id", 400);

    await connectDB();
    const doc = await Collection.findById(id).lean();
    if (!doc || doc.isActive === false) {
      return jsonError("Collection not found", 404);
    }
    return jsonOk({ collection: toCollection(doc) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
    const { id } = await params;
    if (!isValidObjectId(id)) return jsonError("Invalid collection id", 400);

    await connectDB();
    const existing = await Collection.findById(id);
    if (!existing) return jsonError("Collection not found", 404);

    const body = await request.json();
    if (body.name !== undefined) existing.name = String(body.name).trim();
    if (body.slug !== undefined) {
      const slug = slugify(String(body.slug));
      if (!slug) throw new ApiError("Invalid slug");
      existing.slug = slug;
    }
    if (body.isActive !== undefined) existing.isActive = Boolean(body.isActive);

    await existing.save();
    return jsonOk({ collection: toCollection(existing.toObject()) });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
    const { id } = await params;
    if (!isValidObjectId(id)) return jsonError("Invalid collection id", 400);

    await connectDB();
    const existing = await Collection.findById(id);
    if (!existing) return jsonError("Collection not found", 404);

    const hard = new URL(request.url).searchParams.get("hard") === "1";
    const activeProducts = await Product.countDocuments({
      collectionId: id,
      isActive: true,
    });

    if (hard && activeProducts > 0) {
      throw new ApiError(
        `Cannot hard-delete: ${activeProducts} active product(s) still reference this collection`,
        400
      );
    }

    if (hard) {
      await existing.deleteOne();
    } else {
      existing.isActive = false;
      await existing.save();
    }

    return jsonOk({ deleted: true, hard, id });
  } catch (error) {
    return handleApiError(error);
  }
}
