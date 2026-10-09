import { connectDB } from "@/lib/mongodb";
import { BotWaitlist, Product } from "@/models";
import { validateBotApiKey } from "@/lib/bot-auth";
import { normalizeBotPhone } from "@/lib/bot-phone";
import {
  handleApiError,
  jsonCreated,
  requireMongo,
  ApiError,
} from "@/lib/api";

/**
 * POST /api/bot/waitlist
 * Body: { phone, productId, size? }
 */
export async function POST(request: Request) {
  try {
    requireMongo();
    await validateBotApiKey(request);
    await connectDB();

    const body = await request.json();
    const phone = normalizeBotPhone(String(body.phone || ""));
    const productId = String(body.productId || "").trim();
    const size = String(body.size || "").trim();
    if (!phone || !productId) {
      throw new ApiError("phone and productId are required");
    }

    const product = await Product.findById(productId).lean();
    if (!product) throw new ApiError("Product not found", 404);

    await BotWaitlist.updateOne(
      { phone, productId, size },
      {
        $set: {
          phone,
          productId,
          productName: product.name,
          size,
          notifiedAt: null,
        },
      },
      { upsert: true }
    );

    return jsonCreated({
      success: true,
      message: `We'll WhatsApp you when ${product.name}${size ? ` (${size})` : ""} is back.`,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
