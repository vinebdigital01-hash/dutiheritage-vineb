import { applyRateLimit } from "@/lib/rate-limit";
import { connectDB } from "@/lib/mongodb";
import { Customer, Order, Wishlist } from "@/models";
import { requireAuth } from "@/lib/auth";
import { toOrder } from "@/lib/mappers";
import { customerToProfile, serializeCustomer } from "@/lib/customers";
import { handleApiError, jsonOk, requireMongo, ApiError } from "@/lib/api";

/**
 * POST /api/account/data-export
 * Download a JSON copy of this customer's store data.
 */
export async function POST(request: Request) {
  const limited = applyRateLimit(request, { limit: 4, windowMs: 60_000 });
  if (limited) return limited;

  try {
    requireMongo();
    const auth = await requireAuth(request);
    await connectDB();

    const customer = await Customer.findOne({ firebaseUid: auth.uid });
    if (!customer) throw new ApiError("Customer not found", 404);

    const [orders, wishlists] = await Promise.all([
      Order.find({ firebaseUid: auth.uid }).sort({ createdAt: -1 }).limit(100).lean(),
      Wishlist.find({ firebaseUid: auth.uid }).lean(),
    ]);

    return jsonOk({
      exportedAt: new Date().toISOString(),
      customer: serializeCustomer(customer),
      profile: customerToProfile(customer),
      orders: orders.map((d) => toOrder(d, { includeTimeline: false, includeInternal: false })),
      wishlistProductIds: wishlists.map((w) => String(w.productId)),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
