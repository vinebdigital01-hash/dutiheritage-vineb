import { connectDB } from "@/lib/mongodb";
import { Order, ORDER_STATUSES } from "@/models";
import { verifyIdToken, AuthError, getStaffRole } from "@/lib/auth";
import { toOrder } from "@/lib/mappers";
import {
  handleApiError,
  jsonOk,
  jsonCreated,
  requireMongo,
  generateOrderId,
  ApiError,
} from "@/lib/api";
import { buildAdminOrderFilter, parsePageParams } from "@/lib/order-workspace";

/**
 * GET /api/orders
 *  - Admin: paginated list (?q=&status=&paymentMethod=&city=&from=&to=&page=&limit=)
 *  - User: own orders (Bearer token)
 *
 * POST /api/orders
 *  - Create order (guest OK; attach firebaseUid if Bearer present)
 */
export async function GET(request: Request) {
  try {
    requireMongo();
    await connectDB();

    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      throw new AuthError("Authorization required", 401);
    }

    const authUser = await verifyIdToken(authHeader);
    const admin = Boolean(await getStaffRole(authUser.email));
    const { searchParams } = new URL(request.url);

    let filter: Record<string, unknown>;
    if (admin) {
      filter = buildAdminOrderFilter({
        status: searchParams.get("status"),
        q: searchParams.get("q"),
        paymentMethod: searchParams.get("paymentMethod"),
        city: searchParams.get("city"),
        from: searchParams.get("from"),
        to: searchParams.get("to"),
      });
    } else {
      filter = { firebaseUid: authUser.uid };
      const status = searchParams.get("status");
      if (status) {
        if (!(ORDER_STATUSES as readonly string[]).includes(status)) {
          throw new ApiError(`Invalid status. Allowed: ${ORDER_STATUSES.join(", ")}`);
        }
        filter.status = status;
      }
    }

    const { page, pageSize, skip } = parsePageParams(searchParams);

    const [docs, total] = await Promise.all([
      Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(pageSize).lean(),
      Order.countDocuments(filter),
    ]);

    return jsonOk({
      orders: docs.map((d) => toOrder(d, { includeTimeline: false })),
      count: docs.length,
      total,
      page,
      pageSize,
      pages: Math.max(1, Math.ceil(total / pageSize)),
      isAdmin: admin,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    requireMongo();
    await connectDB();

    let firebaseUid: string | undefined;
    let customerId: string | undefined;

    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        const authUser = await verifyIdToken(authHeader);
        firebaseUid = authUser.uid;
      } catch {
        // Guest checkout may send a bad token — ignore and continue as guest
      }
    }

    const body = await request.json();
    const customer = body.customer;
    if (!customer?.name || !customer?.phone || !customer?.address) {
      throw new ApiError("customer.name, customer.phone, and customer.address are required");
    }
    if (!customer.city || !customer.state || !customer.pinCode) {
      throw new ApiError("customer.city, customer.state, and customer.pinCode are required");
    }

    const items = Array.isArray(body.items) ? body.items : [];
    if (items.length === 0) throw new ApiError("items must be a non-empty array");

    for (const item of items) {
      if (!item.productId || !item.name || !item.quantity || item.price == null) {
        throw new ApiError(
          "Each item needs productId, name, quantity, and price"
        );
      }
    }

    const paymentMethod = body.paymentMethod as "prepaid" | "cod" | "partial";
    if (!["prepaid", "cod", "partial"].includes(paymentMethod)) {
      throw new ApiError("paymentMethod must be prepaid, cod, or partial");
    }

    const subtotal = Number(body.subtotal);
    const total = Number(body.total);
    if (Number.isNaN(subtotal) || Number.isNaN(total)) {
      throw new ApiError("subtotal and total are required numbers");
    }

    if (body.customerId) customerId = String(body.customerId);

    const paymentStatus =
      paymentMethod === "cod"
        ? "pending"
        : paymentMethod === "partial"
          ? "partially_paid"
          : body.paymentStatus || "pending";

    const doc = await Order.create({
      orderId: body.orderId || generateOrderId(),
      customerId,
      firebaseUid,
      customer: {
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        apartment: customer.apartment,
        city: customer.city,
        state: customer.state,
        pinCode: customer.pinCode,
        country: customer.country || "IN",
      },
      items: items.map(
        (item: {
          productId: string;
          slug?: string;
          name: string;
          image?: string;
          size?: string;
          color?: string;
          quantity: number;
          price: number;
          salePrice?: number;
        }) => ({
          productId: String(item.productId),
          slug: item.slug,
          name: String(item.name),
          image: item.image,
          size: item.size,
          color: item.color,
          quantity: Number(item.quantity),
          price: Number(item.price),
          salePrice: item.salePrice,
        })
      ),
      subtotal,
      discount: Number(body.discount ?? 0),
      shipping: Number(body.shipping ?? 0),
      codCharge: Number(body.codCharge ?? 0),
      prepaidDiscount: Number(body.prepaidDiscount ?? 0),
      total,
      paymentMethod,
      paymentStatus,
      razorpayOrderId: body.razorpayOrderId,
      razorpayPaymentId: body.razorpayPaymentId,
      couponCode: body.couponCode,
      status: body.status || "Confirmation Pending",
      notes: body.notes,
    });

    return jsonCreated({ order: toOrder(doc.toObject()) });
  } catch (error) {
    return handleApiError(error);
  }
}
