import { db } from "@/services/db";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models";
import { requireAuth } from "@/lib/auth";
import { toProduct } from "@/lib/mappers";
import { refreshCollectionProductCount } from "@/lib/catalog";
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
 * GET /api/products?slug=&collectionId=&limit=&all=1 (admin: include inactive)
 * POST /api/products (admin)
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get("slug");
    const collectionId = searchParams.get("collectionId");
    const limit = Number(searchParams.get("limit") || "0");
    const includeAll = searchParams.get("all") === "1";

    if (includeAll) {
      requireMongo();
      await requireAuth(request, { admin: true });
      await connectDB();
      const filter: Record<string, unknown> = {};
      if (collectionId) filter.collectionId = collectionId;
      if (slug) filter.slug = slug;
      const docs = await Product.find(filter).sort({ createdAt: -1 }).lean();
      const products = docs.map((d) => toProduct(d));
      return jsonOk({ products, count: products.length });
    }

    if (slug) {
      const product = await db.getProductBySlug(slug);
      if (!product) return jsonError("Product not found", 404);
      return jsonOk({ product });
    }

    let products = collectionId
      ? await db.getProductsByCollectionId(collectionId)
      : await db.getAllProducts();

    if (limit > 0) {
      products = products.slice(0, limit);
    }

    return jsonOk({ products, count: products.length });
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

    const price = Number(body.price);
    if (Number.isNaN(price) || price < 0) {
      throw new ApiError("Valid price is required");
    }

    const image = String(body.image || "").trim();
    if (!image) throw new ApiError("image is required");

    const collectionId = String(body.collectionId || "").trim();
    if (!collectionId) throw new ApiError("collectionId is required");

    const slug = slugify(String(body.slug || name));
    if (!slug) throw new ApiError("Could not derive slug");

    const existing = await Product.findOne({ slug });
    if (existing) throw new ApiError("A product with this slug already exists", 409);

    const doc = await Product.create({
      name,
      slug,
      price,
      salePrice: body.salePrice ?? null,
      description: body.description ?? "",
      collectionId,
      image,
      images: body.images ?? [],
      sizes: body.sizes ?? [],
      colors: body.colors ?? [],
      tags: body.tags ?? [],
      badge: body.badge,
      seoTitle: body.seoTitle,
      seoDescription: body.seoDescription,
      boughtLast7Days: body.boughtLast7Days ?? 0,
      videoUrls: body.videoUrls ?? [],
      offers: body.offers ?? [],
      codAvailable: body.codAvailable !== false,
      isActive: body.isActive !== false,
    });

    await refreshCollectionProductCount(collectionId);

    return jsonCreated({ product: toProduct(doc.toObject()) });
  } catch (error) {
    return handleApiError(error);
  }
}
