import { db } from "@/services/db";
import { connectDB } from "@/lib/mongodb";
import { Collection } from "@/models";
import { requireAuth } from "@/lib/auth";
import { toCollection } from "@/lib/mappers";
import {
  handleApiError,
  jsonOk,
  jsonError,
  jsonCreated,
  requireMongo,
  slugify,
  ApiError,
} from "@/lib/api";

/**
 * GET /api/collections?slug=&all=1
 * POST /api/collections (admin)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const includeAll = searchParams.get("all") === "1";

    if (includeAll) {
      requireMongo();
      await requireAuth(request, { admin: true });
      await connectDB();
      const docs = await Collection.find({}).sort({ createdAt: 1 }).lean();
      const collections = docs.map((d) => toCollection(d));
      return jsonOk({ collections, count: collections.length });
    }

    if (slug) {
      const collection = await db.getCollectionBySlug(slug);
      if (!collection) return jsonError("Collection not found", 404);
      return jsonOk({ collection });
    }

    const collections = await db.getAllCollections();
    return jsonOk({ collections, count: collections.length });
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
    const name = String(body.name || "").trim();
    if (!name) throw new ApiError("name is required");

    const slug = slugify(String(body.slug || name));
    if (!slug) throw new ApiError("Could not derive slug");

    const existing = await Collection.findOne({ slug });
    if (existing) {
      throw new ApiError("A collection with this slug already exists", 409);
    }

    const doc = await Collection.create({
      name,
      slug,
      productCount: 0,
      isActive: body.isActive !== false,
    });

    return jsonCreated({ collection: toCollection(doc.toObject()) });
  } catch (error) {
    return handleApiError(error);
  }
}
