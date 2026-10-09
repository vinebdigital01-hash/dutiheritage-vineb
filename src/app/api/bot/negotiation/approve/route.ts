import { connectDB } from "@/lib/mongodb";
import { Coupon, Customer, Product } from "@/models";
import { validateBotApiKey } from "@/lib/bot-auth";
import { normalizeBotPhone, phoneMatchOr } from "@/lib/bot-phone";
import {
  handleApiError,
  jsonCreated,
  requireMongo,
  ApiError,
} from "@/lib/api";

function namePrefix(name: string): string {
  const letters = name.replace(/[^a-zA-Z]/g, "").toUpperCase();
  return (letters.slice(0, 6) || "DUTI").slice(0, 6);
}

async function uniqueCode(prefix: string, percent: number): Promise<string> {
  for (let i = 0; i < 8; i++) {
    const code = `${prefix}${percent}${i > 0 ? Math.random().toString(36).slice(2, 4).toUpperCase() : ""}`.slice(0, 12);
    const exists = await Coupon.exists({ code });
    if (!exists) return code;
  }
  throw new ApiError("Could not generate coupon code", 500);
}

/**
 * POST /api/bot/negotiation/approve
 * Body: { customerPhone, productId, discountPercent?=10, customerName? }
 * Creates a 24h phone-restricted coupon.
 */
export async function POST(request: Request) {
  try {
    requireMongo();
    await validateBotApiKey(request);
    await connectDB();

    const body = await request.json();
    const customerPhone = normalizeBotPhone(
      String(body.customerPhone || body.phone || "")
    );
    const productId = String(body.productId || "").trim();
    const discountPercent = Math.min(
      50,
      Math.max(1, Number(body.discountPercent) || 10)
    );
    if (!customerPhone || !productId) {
      throw new ApiError("customerPhone and productId are required");
    }

    const product = await Product.findById(productId).lean();
    if (!product) throw new ApiError("Product not found", 404);

    const customer = await Customer.findOne({
      $or: phoneMatchOr("phone", customerPhone),
    }).lean();

    const prefix = namePrefix(
      String(body.customerName || customer?.name || "GUEST")
    );
    const code = await uniqueCode(prefix, discountPercent);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const coupon = await Coupon.create({
      code,
      discountType: "PERCENT",
      discountValue: discountPercent,
      scope: "SPECIFIC_PRODUCTS",
      targetIds: [product._id.toString()],
      usageLimit: 1,
      perUserLimit: 1,
      active: true,
      expiresAt,
      restrictedToPhone: customerPhone,
    });

    const storefront =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.STOREFRONT_URL ||
      "https://dutiheritage.co.in";
    const checkoutUrl = `${storefront.replace(/\/$/, "")}/checkout?product=${product.slug}&coupon=${coupon.code}`;

    return jsonCreated({
      coupon: {
        code: coupon.code,
        discountPercent,
        expiresAt: expiresAt.toISOString(),
        restrictedToPhone: customerPhone,
        productId: product._id.toString(),
        productName: product.name,
        checkoutUrl,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
