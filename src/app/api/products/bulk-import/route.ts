import { Product as ProductModel, Collection as CollectionModel } from "@/models";
import { requireAuth } from "@/lib/auth";
import { CATALOG_WRITE } from "@/lib/rbac";
import { toProduct } from "@/lib/mappers";
import { connectDB } from "@/lib/mongodb";
import { refreshCollectionProductCount } from "@/lib/catalog";
import { logAdminAction } from "@/lib/admin-audit";
import {
  handleApiError,
  jsonOk,
  jsonError,
  requireMongo,
  slugify,
  isValidObjectId,
  ApiError,
} from "@/lib/api";

function cell(row: Record<string, string>, ...keys: string[]) {
  for (const key of keys) {
    const v = row[key];
    if (v != null && String(v).trim()) return String(v).trim();
  }
  return "";
}

function normalizeRow(raw: Record<string, unknown>) {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw || {})) {
    const key = String(k)
      .replace(/^\uFEFF/, "")
      .trim();
    if (!key) continue;
    out[key] = v == null ? "" : String(v).trim();
  }
  return out;
}

function splitList(value: string) {
  if (!value) return [] as string[];
  return value
    .split(/[,;|]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseBool(value: string, fallback: boolean) {
  const s = value.toLowerCase();
  if (["true", "yes", "1"].includes(s)) return true;
  if (["false", "no", "0"].includes(s)) return false;
  return fallback;
}

function escapeRegex(input: string) {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function resolveCollectionId(row: Record<string, string>) {
  const rawId = cell(row, "collectionId", "collection_id");
  if (rawId && isValidObjectId(rawId)) {
    const byId = await CollectionModel.findById(rawId);
    if (byId) return byId._id.toString();
  }
  if (rawId) {
    const bySlug = await CollectionModel.findOne({ slug: slugify(rawId) });
    if (bySlug) return bySlug._id.toString();
  }

  const name = cell(row, "collectionName", "collection", "category");
  if (!name) return "";

  const slug = slugify(name);
  let col = await CollectionModel.findOne({
    $or: [{ slug }, { name: new RegExp(`^${escapeRegex(name)}$`, "i") }],
  });
  if (!col) {
    col = await CollectionModel.create({
      name,
      slug,
      isActive: true,
    });
  }
  return col._id.toString();
}

export async function POST(req: Request) {
  try {
    requireMongo();
    const authUser = await requireAuth(req, { admin: true, roles: CATALOG_WRITE });
    await connectDB();
    const body = await req.json();
    const products = Array.isArray(body?.products) ? body.products : [];

    if (products.length === 0) {
      return jsonError("No products in the spreadsheet");
    }
    if (products.length > 500) {
      throw new ApiError("Upload at most 500 products at a time");
    }

    const imported: ReturnType<typeof toProduct>[] = [];
    const errors: string[] = [];
    const touchedCollections = new Set<string>();
    const actor = authUser.email || authUser.uid || "admin";

    for (let i = 0; i < products.length; i++) {
      const p = normalizeRow(products[i] as Record<string, unknown>);
      const name = cell(p, "name");
      if (!name) {
        const empty = Object.values(p).every((v) => !v);
        if (empty) continue;
        errors.push(`Row ${i + 1}: missing product name`);
        continue;
      }

      try {
        const collectionId = await resolveCollectionId(p);
        if (!collectionId) {
          throw new Error("Missing collectionName (or collectionId)");
        }

        const newSlug = slugify(cell(p, "slug") || name);
        const sizes = splitList(cell(p, "sizes", "size"));
        const colors = splitList(cell(p, "colors", "color"));
        const tags = splitList(cell(p, "tags"));
        const images = splitList(cell(p, "images", "gallery"));
        const videoUrls = splitList(cell(p, "videoUrls", "videos"));
        let mainImage = cell(p, "image") || images[0] || "";
        if (!mainImage) {
          mainImage = "https://res.cloudinary.com/demo/image/upload/v1727096000/placeholder.png"; // Placeholder so it doesn't crash
        }

        const priceStr = cell(p, "price").replace(/[^\d.]/g, "");
        const price = Number(priceStr);
        if (!Number.isFinite(price) || price < 0 || priceStr === "") {
          throw new Error("Price must be a number");
        }
        const saleRaw = cell(p, "salePrice", "sale_price").replace(/[^\d.]/g, "");
        const salePrice = saleRaw ? Number(saleRaw) : null;

        const stockRaw = cell(p, "stock").replace(/[^\d.]/g, "");
        const hasStock = stockRaw !== "";
        const stockVal = hasStock ? Math.max(0, Number(stockRaw) || 0) : 0;
        const sizeList = sizes.length ? sizes : ["Free Size"];
        const inventory = sizeList.map((size) => ({
          size,
          stock: hasStock ? stockVal : 0,
        }));

        const payload = {
          name,
          slug: newSlug,
          price,
          salePrice: salePrice != null && Number.isFinite(salePrice) ? salePrice : null,
          description: cell(p, "description"),
          collectionId,
          image: mainImage,
          images,
          sizes: sizeList,
          colors,
          tags,
          seoTitle: cell(p, "seoTitle") || name,
          seoDescription: cell(p, "seoDescription"),
          boughtLast7Days: Number(cell(p, "boughtLast7Days")) || 0,
          videoUrls,
          codAvailable: parseBool(cell(p, "codAvailable"), true),
          isPartialCOD: parseBool(cell(p, "isPartialCOD"), false),
          partialCODAdvance: Number(cell(p, "partialCODAdvance")) || 0,
          isActive: parseBool(cell(p, "isActive"), true),
          hsn: cell(p, "hsn") || "6104",
          gstRate: Number(cell(p, "gstRate")) || 5,
          lastEditedBy: actor,
        };

        const existing = await ProductModel.findOne({ slug: newSlug });
        if (existing) {
          Object.assign(existing, payload);
          if (hasStock || !existing.inventory?.length) {
            existing.set("inventory", inventory);
            existing.trackInventory = true;
          }
          await existing.save();
          imported.push(toProduct(existing.toObject() as never));
        } else {
          const doc = await ProductModel.create({
            ...payload,
            inventory,
            trackInventory: hasStock || sizeList.length > 0,
            stockStatus: hasStock && stockVal <= 0 ? "out_of_stock" : "in_stock",
          });
          imported.push(toProduct(doc.toObject() as never));
        }

        touchedCollections.add(collectionId);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        const friendly = msg.includes("E11000")
          ? "A product with this slug already exists"
          : msg;
        errors.push(`Row ${i + 1} (${name}): ${friendly}`);
      }
    }

    await Promise.all(
      [...touchedCollections].map((id) => refreshCollectionProductCount(id))
    );

    await logAdminAction({
      request: req,
      actor: authUser,
      action: "bulk_import",
      resource: "product",
      message: `Imported ${imported.length} products`,
    }).catch(() => {});

    return jsonOk({
      success: true,
      imported: imported.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
