import { connectDB } from "@/lib/mongodb";
import { WhatsAppAbandonedCheckout } from "@/models";
import { validateBotApiKey } from "@/lib/bot-auth";
import { normalizeBotPhone } from "@/lib/bot-phone";
import {
  handleApiError,
  jsonCreated,
  requireMongo,
  ApiError,
} from "@/lib/api";

/**
 * POST /api/bot/tracking/abandoned
 * Bot logs that a shopper started WhatsApp checkout / payment link.
 */
export async function POST(request: Request) {
  try {
    requireMongo();
    await validateBotApiKey(request);
    await connectDB();

    const body = await request.json();
    const phone = normalizeBotPhone(String(body.phone || ""));
    if (!phone) throw new ApiError("phone is required");

    const productId = String(body.productId || "").trim();
    const productName = String(body.productName || "").trim();

    const doc = await WhatsAppAbandonedCheckout.create({
      phone,
      productId,
      productName,
      meta: body.meta || {},
      notifiedAt: null,
      convertedAt: null,
    });

    return jsonCreated({
      success: true,
      id: doc._id.toString(),
      checkAfterMinutes: 30,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
