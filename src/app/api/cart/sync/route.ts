import { connectDB } from "@/lib/mongodb";
import { Cart } from "@/models";
import { requireAuth, verifyIdToken } from "@/lib/auth";
import {
  handleApiError,
  jsonOk,
  requireMongo,
  ApiError,
} from "@/lib/api";

type CartItemBody = {
  productId: string;
  size?: string;
  color?: string;
  quantity: number;
  price?: number;
  name?: string;
  image?: string;
};

/**
 * POST /api/cart/sync
 * Upsert active cart for logged-in user or guest email/session.
 * Body: { items, email?, phone?, sessionId?, status? }
 */
export async function POST(request: Request) {
  try {
    requireMongo();
    await connectDB();

    const body = (await request.json()) as {
      items?: CartItemBody[];
      email?: string;
      phone?: string;
      sessionId?: string;
      markPurchased?: boolean;
    };

    const items = Array.isArray(body.items)
      ? body.items
          .filter((i) => i.productId && Number(i.quantity) > 0)
          .map((i) => ({
            productId: String(i.productId),
            size: i.size,
            color: i.color,
            quantity: Math.max(1, Number(i.quantity) || 1),
            price: i.price != null ? Number(i.price) : undefined,
            name: i.name,
            image: i.image,
          }))
      : [];

    let firebaseUid: string | undefined;
    let email = body.email?.trim().toLowerCase();
    let phone = body.phone?.trim();

    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const user = await verifyIdToken(authHeader);
        firebaseUid = user.uid;
        email = email || user.email?.toLowerCase() || undefined;
        phone = phone || user.token.phone_number || undefined;
      } catch {
        // guest sync without valid token is OK if email/session present
      }
    }

    if (!firebaseUid && !email && !body.sessionId) {
      throw new ApiError(
        "Provide auth token, email, or sessionId to sync cart",
        400
      );
    }

    const filter: Record<string, unknown> = {};
    if (firebaseUid) filter.firebaseUid = firebaseUid;
    else if (email) filter.email = email;
    else filter.sessionId = body.sessionId;

    let cart = await Cart.findOne({
      ...filter,
      status: { $in: ["active", "abandoned", "emailed"] },
    }).sort({ updatedAt: -1 });

    if (body.markPurchased) {
      await Cart.updateMany(filter, {
        $set: { status: "purchased", lastUpdated: new Date(), items },
      });
      return jsonOk({ status: "purchased" });
    }

    if (items.length === 0) {
      if (cart) {
        cart.set("items", []);
        cart.status = "active";
        cart.lastUpdated = new Date();
        await cart.save();
      }
      return jsonOk({ status: "empty", cartId: cart?._id?.toString() });
    }

    if (!cart) {
      cart = await Cart.create({
        firebaseUid,
        email,
        phone,
        sessionId: body.sessionId,
        items,
        status: "active",
        lastUpdated: new Date(),
      });
    } else {
      cart.set("items", items);
      cart.email = email || cart.email;
      cart.phone = phone || cart.phone;
      cart.firebaseUid = firebaseUid || cart.firebaseUid;
      cart.sessionId = body.sessionId || cart.sessionId;
      cart.status = "active";
      cart.lastUpdated = new Date();
      await cart.save();
    }

    return jsonOk({
      cartId: cart._id.toString(),
      status: cart.status,
      itemCount: items.length,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * GET /api/cart/sync — current active cart for auth user (optional)
 */
export async function GET(request: Request) {
  try {
    requireMongo();
    const user = await requireAuth(request);
    await connectDB();
    const cart = await Cart.findOne({
      firebaseUid: user.uid,
      status: { $in: ["active", "abandoned", "emailed"] },
    })
      .sort({ updatedAt: -1 })
      .lean();

    return jsonOk({
      cart: cart
        ? {
            id: cart._id.toString(),
            items: cart.items,
            status: cart.status,
            lastUpdated: cart.lastUpdated,
            email: cart.email,
          }
        : null,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
