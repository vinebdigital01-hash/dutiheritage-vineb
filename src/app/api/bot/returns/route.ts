import { connectDB } from "@/lib/mongodb";
import { Order, ReturnRequest } from "@/models";
import { validateBotApiKey } from "@/lib/bot-auth";
import { phoneMatchOr, normalizeBotPhone } from "@/lib/bot-phone";
import {
  handleApiError,
  jsonCreated,
  requireMongo,
  ApiError,
} from "@/lib/api";

/**
 * POST /api/bot/returns
 * Body: { phone, orderId, reason, imageUrl? }
 */
export async function POST(request: Request) {
  try {
    requireMongo();
    await validateBotApiKey(request);
    await connectDB();

    const body = await request.json();
    const phone = normalizeBotPhone(String(body.phone || ""));
    const orderId = String(body.orderId || "").trim();
    const reason = String(body.reason || "").trim();
    const imageUrl = String(body.imageUrl || "").trim();

    if (!phone || !orderId) {
      throw new ApiError("phone and orderId are required");
    }

    const order = await Order.findOne({
      orderId,
      $or: phoneMatchOr("customer.phone", phone),
    }).lean();

    if (!order) {
      throw new ApiError("Order not found for this phone", 404);
    }

    const existing = await ReturnRequest.findOne({
      orderId: order.orderId,
      status: { $in: ["requested", "approved"] },
    }).lean();
    if (existing) {
      throw new ApiError("A return request already exists for this order", 400);
    }

    const doc = await ReturnRequest.create({
      orderId: order.orderId,
      orderMongoId: order._id.toString(),
      customerName: order.customer?.name || "",
      customerPhone: phone,
      type: "return",
      status: "requested",
      source: "whatsapp",
      reason: reason || "WhatsApp return request",
      imageUrl,
      items: (order.items || []).map((i) => ({
        productId: i.productId,
        name: i.name,
        image: i.image || "",
        size: i.size || "",
        quantity: i.quantity,
      })),
      refundAmount: 0,
    });

    return jsonCreated({
      success: true,
      returnId: doc._id.toString(),
      orderId: doc.orderId,
      status: doc.status,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
