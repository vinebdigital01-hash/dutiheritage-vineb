import { db } from "@/services/db";
import { Coupon } from "@/models/Coupon";
import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models";
import { requireAuth } from "@/lib/auth";
import { CATALOG_WRITE } from "@/lib/rbac";
import { logAdminAction } from "@/lib/admin-audit";
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
    const includeAll = searchParams.get("all") === "1";
    
    // Pagination params
    const page = Math.max(1, Number(searchParams.get("page") || "1"));
    const limitParam = Number(searchParams.get("limit"));
    const limit = limitParam > 0 ? Math.min(limitParam, 100) : 20;

    requireMongo();
    await connectDB();

    if (includeAll) {
      await requireAuth(request, { admin: true });
      const filter: Record<string, unknown> = {};
      if (collectionId) filter.collectionId = collectionId;
      if (slug) filter.slug = slug;
      
      const skip = (page - 1) * limit;
      const [docs, total] = await Promise.all([
        Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Product.countDocuments(filter)
      ]);
      const products = docs.map((d) => toProduct(d));
      return new Response(JSON.stringify({ products, count: products.length, total, page, totalPages: Math.ceil(total / limit) }), { status: 200, headers: { "Content-Type": "application/json" } });
    }

    if (slug) {
      const product = await db.getProductBySlug(slug);
      if (!product) return new Response(JSON.stringify({ error: "Not found" }), { status: 404 });
      return new Response(JSON.stringify({ product }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300"
        }
      });
    }

    const filter: Record<string, unknown> = { isActive: true };
    if (collectionId) filter.collectionId = collectionId;
    
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      Product.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Product.countDocuments(filter)
    ]);
    const products = docs.map((d) => toProduct(d));

    return new Response(JSON.stringify({
      products,
      count: products.length,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300"
      }
    });

  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    requireMongo();
    const authUser = await requireAuth(request, { admin: true, roles: CATALOG_WRITE });
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
        isPartialCOD: Boolean(body.isPartialCOD),
        partialCODAdvance: Number(body.partialCODAdvance) || 0,
      isActive: body.isActive !== false,
      trackInventory: Boolean(body.trackInventory),
      lowStockThreshold: Number(body.lowStockThreshold) || 3,
      hsn: String(body.hsn || "6104").trim() || "6104",
      gstRate: Math.min(28, Math.max(0, Number(body.gstRate) || 5)),
      inventory: Array.isArray(body.inventory)
        ? body.inventory
            .map((i: { size?: string; stock?: number; sku?: string }) => ({
              size: String(i.size || "").trim(),
              stock: Number(i.stock) || 0,
              sku: String(i.sku || "").trim(),
            }))
            .filter((i: { size: string }) => i.size)
        : [],
    });

    await refreshCollectionProductCount(collectionId);
    await logAdminAction({
      request,
      actor: authUser,
      action: "create",
      resource: "product",
      resourceId: doc._id.toString(),
      message: name,
    });

    return jsonCreated({ product: toProduct(doc.toObject()) });
  } catch (error) {
    return handleApiError(error);
  }
}
