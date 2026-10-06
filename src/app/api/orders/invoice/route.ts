import { applyRateLimit } from "@/lib/rate-limit";
import { connectDB } from "@/lib/mongodb";
import { Order } from "@/models";
import { verifyIdToken, getStaffRole } from "@/lib/auth";
import { toOrder } from "@/lib/mappers";
import { phonesMatch } from "@/lib/guest-order";
import { getStoreSettings } from "@/lib/store-settings";
import {
  handleApiError,
  jsonOk,
  jsonError,
  requireMongo,
  ApiError,
} from "@/lib/api";

/**
 * POST /api/orders/invoice
 * Full order for GST print — owner (Bearer) or guest (orderId + phone).
 */
export async function POST(request: Request) {
  const limited = applyRateLimit(request, { limit: 12, windowMs: 60_000 });
  if (limited) return limited;

  try {
    requireMongo();
    const body = await request.json();
    const orderId = String(body.orderId || "").trim().toUpperCase();
    const phone = String(body.phone || "").trim();

    if (!orderId) throw new ApiError("Order number is required", 400);

    await connectDB();
    const doc = await Order.findOne({
      orderId: {
        $regex: new RegExp(
          `^${orderId.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
          "i"
        ),
      },
    }).lean();

    if (!doc) {
      return jsonError("Order not found.", 404);
    }

    const order = toOrder(doc, { includeTimeline: false, includeInternal: false });
    let allowed = false;

    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const user = await verifyIdToken(authHeader);
        const staff = Boolean(await getStaffRole(user.email));
        if (staff || (order.firebaseUid && order.firebaseUid === user.uid)) {
          allowed = true;
        }
      } catch {
        /* try phone */
      }
    }

    if (!allowed) {
      if (phone.replace(/\D/g, "").length < 10) {
        throw new ApiError("Enter the 10-digit phone used at checkout.", 400);
      }
      if (!phonesMatch(order.customer.phone, phone)) {
        return jsonError("Order not found. Check the order number and phone.", 404);
      }
      allowed = true;
    }

    const settings = await getStoreSettings();
    const seller = {
      legalName: settings.legalName,
      gstin: settings.gstin,
      address: settings.address,
      state: settings.state,
      stateCode: settings.stateCode,
      supportEmail: settings.supportEmail,
      supportPhone: settings.supportPhone,
    };

    return jsonOk({ order, seller });
  } catch (error) {
    return handleApiError(error);
  }
}
