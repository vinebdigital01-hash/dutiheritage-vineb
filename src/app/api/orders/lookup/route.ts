import { applyRateLimit } from "@/lib/rate-limit";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models";
import { toOrder } from "@/lib/mappers";
import { phonesMatch, toGuestOrderView } from "@/lib/guest-order";
import {
  handleApiError,
  jsonOk,
  jsonError,
  requireMongo,
  ApiError,
} from "@/lib/api";

/**
 * POST /api/orders/lookup
 * Guest order status: order number + phone (no Firebase).
 */
export async function POST(request: Request) {
  const limited = applyRateLimit(request, { limit: 8, windowMs: 60_000 });
  if (limited) return limited;

  try {
    requireMongo();
    const body = await request.json();
    const orderId = String(body.orderId || "").trim().toUpperCase();
    const phone = String(body.phone || "").trim();

    if (!orderId || phone.replace(/\D/g, "").length < 10) {
      throw new ApiError("Enter your order number and 10-digit phone.", 400);
    }

    await connectDB();
    const doc = await Order.findOne({
      orderId: { $regex: new RegExp(`^${orderId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i") },
    }).lean();

    if (!doc) {
      return jsonError("Order not found. Check the order number and phone.", 404);
    }

    const order = toOrder(doc, { includeTimeline: false, includeInternal: false });
    if (!phonesMatch(order.customer.phone, phone)) {
      return jsonError("Order not found. Check the order number and phone.", 404);
    }

    return jsonOk({ order: toGuestOrderView(order) });
  } catch (error) {
    return handleApiError(error);
  }
}
