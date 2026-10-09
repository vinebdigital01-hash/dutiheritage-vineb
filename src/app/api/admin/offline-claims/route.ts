import { connectDB } from "@/lib/mongodb";
import { OfflineClaim, Product } from "@/models";
import { requireAuth } from "@/lib/auth";
import { OPS_WRITE } from "@/lib/rbac";
import {
  handleApiError,
  jsonCreated,
  jsonOk,
  requireMongo,
  ApiError,
} from "@/lib/api";

function randomClaimId(len = 6): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < len; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/**
 * POST /api/admin/offline-claims
 * Body: { productId, size }
 * Returns: { claimId, waUrl }
 */
export async function POST(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true, roles: OPS_WRITE });
    await connectDB();

    const body = await request.json();
    const productId = String(body.productId || "").trim();
    const size = String(body.size || "").trim();
    if (!productId || !size) {
      throw new ApiError("productId and size are required");
    }

    const product = await Product.findById(productId).lean();
    if (!product) throw new ApiError("Product not found", 404);

    let claimId = "";
    for (let i = 0; i < 8; i++) {
      const candidate = randomClaimId(6);
      const exists = await OfflineClaim.exists({ claimId: candidate });
      if (!exists) {
        claimId = candidate;
        break;
      }
    }
    if (!claimId) throw new ApiError("Could not generate claim id", 500);

    const price =
      product.salePrice && product.salePrice > 0 && product.salePrice < product.price
        ? Number(product.salePrice)
        : Number(product.price) || 0;

    const doc = await OfflineClaim.create({
      claimId,
      productId: product._id.toString(),
      productName: product.name,
      size,
      price,
      isClaimed: false,
    });

    const botPhone = (process.env.BOT_PHONE || "").replace(/\D/g, "");
    const waUrl = botPhone
      ? `https://wa.me/${botPhone}?text=${encodeURIComponent(`Claim-Order-${doc.claimId}`)}`
      : "";

    return jsonCreated({
      claimId: doc.claimId,
      productId: doc.productId,
      productName: doc.productName,
      size: doc.size,
      price: doc.price,
      waUrl,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/** GET recent unclaimed / all claims for admin */
export async function GET(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true, roles: OPS_WRITE });
    await connectDB();
    const docs = await OfflineClaim.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return jsonOk({
      claims: docs.map((d) => ({
        claimId: d.claimId,
        productId: d.productId,
        productName: d.productName,
        size: d.size,
        price: d.price,
        isClaimed: d.isClaimed,
        claimedByPhone: d.claimedByPhone,
        orderId: d.orderId,
        createdAt: d.createdAt,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
