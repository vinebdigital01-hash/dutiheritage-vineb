import { connectDB } from "@/lib/mongodb";
import { Order, Coupon, Customer, Cart } from "@/models";
import { verifyIdToken } from "@/lib/auth";
import { upsertCustomerFromAuth } from "@/lib/customers";
import { toOrder } from "@/lib/mappers";
import { sendOrderPlaced } from "@/lib/automations";
import {
  isRazorpayConfigured,
  verifyRazorpaySignature,
} from "@/lib/razorpay";
import {
  getCheckoutSettings,
  priceCartLines,
  resolveCouponDiscount,
  computeCheckoutTotals,
  type CartLineInput,
} from "@/services/checkout";
import {
  handleApiError,
  jsonCreated,
  requireMongo,
  generateOrderId,
  ApiError,
} from "@/lib/api";

type PlaceOrderBody = {
  paymentMethod: "prepaid" | "cod" | "partial";
  customer: {
    email?: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    phone: string;
    address: string;
    apartment?: string;
    city: string;
    state: string;
    pinCode: string;
    country?: string;
  };
  items: CartLineInput[];
  couponCode?: string | null;
  saveToProfile?: boolean;
  razorpay?: {
    orderId: string;
    paymentId: string;
    signature: string;
  } | null;
  /** Dev-only: allow placing prepaid without Razorpay when keys missing */
  allowUnpaidDev?: boolean;
};

/**
 * POST /api/checkout/place-order
 * Recalculates totals server-side, verifies Razorpay when needed, creates Order.
 */
export async function POST(request: Request) {
  try {
    requireMongo();
    await connectDB();

    const body = (await request.json()) as PlaceOrderBody;
    const paymentMethod = body.paymentMethod;

    if (!["prepaid", "cod", "partial"].includes(paymentMethod)) {
      throw new ApiError("Invalid paymentMethod");
    }

    const c = body.customer;
    if (!c?.phone || !c?.address || !c?.city || !c?.state || !c?.pinCode) {
      throw new ApiError(
        "customer.phone, address, city, state, and pinCode are required"
      );
    }

    const name =
      c.name?.trim() ||
      `${c.firstName || ""} ${c.lastName || ""}`.trim();
    if (!name) throw new ApiError("customer name is required");

    if (!Array.isArray(body.items) || body.items.length === 0) {
      throw new ApiError("items are required");
    }

    let firebaseUid: string | undefined;
    let authUser = null as Awaited<ReturnType<typeof verifyIdToken>> | null;

    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      try {
        authUser = await verifyIdToken(authHeader);
        firebaseUid = authUser.uid;
      } catch {
        // guest checkout
      }
    }

    const settings = await getCheckoutSettings();
    const lines = await priceCartLines(body.items);
    const subtotalPreview = lines.reduce(
      (s, l) => s + (l.salePrice ?? l.price) * l.quantity,
      0
    );

    const coupon = await resolveCouponDiscount(body.couponCode, subtotalPreview, {
      productIds: lines.map((l) => l.productId),
      collectionIds: lines.map((l) => l.collectionId),
    });

    const totals = computeCheckoutTotals({
      lines,
      paymentMethod,
      settings,
      discountAmount: coupon?.amount ?? 0,
      pinCode: c.pinCode.trim(),
      city: c.city,
    });

    const needsOnlinePay =
      paymentMethod === "prepaid" || paymentMethod === "partial";

    let paymentStatus: "pending" | "paid" | "partially_paid" = "pending";
    let razorpayOrderId: string | undefined;
    let razorpayPaymentId: string | undefined;

    if (needsOnlinePay && totals.amountToPayNow > 0) {
      if (isRazorpayConfigured()) {
        if (
          !body.razorpay?.orderId ||
          !body.razorpay?.paymentId ||
          !body.razorpay?.signature
        ) {
          throw new ApiError("Razorpay payment details are required", 400);
        }

        const valid = verifyRazorpaySignature({
          razorpayOrderId: body.razorpay.orderId,
          razorpayPaymentId: body.razorpay.paymentId,
          razorpaySignature: body.razorpay.signature,
        });

        if (!valid) {
          throw new ApiError("Invalid Razorpay payment signature", 400);
        }

        razorpayOrderId = body.razorpay.orderId;
        razorpayPaymentId = body.razorpay.paymentId;
        paymentStatus =
          paymentMethod === "partial" ? "partially_paid" : "paid";
      } else if (!body.allowUnpaidDev) {
        throw new ApiError(
          "Razorpay is not configured. Add keys to .env.local or use COD.",
          503
        );
      }
      // else: unpaid/dev prepaid allowed
    }

    let customerId: string | undefined;

    if (authUser && body.saveToProfile) {
      const { customer } = await upsertCustomerFromAuth(authUser, {
        name,
        email: c.email || authUser.email,
        phone: c.phone,
        address: c.address,
        apartment: c.apartment,
        city: c.city,
        state: c.state,
        pinCode: c.pinCode,
        country: c.country || "IN",
      });
      customerId = customer._id.toString();
    } else if (c.email || c.phone) {
      // Guest / lightweight customer upsert by email or phone
      const existing =
        (c.email
          ? await Customer.findOne({ email: c.email.trim().toLowerCase() })
          : null) ||
        (c.phone ? await Customer.findOne({ phone: c.phone.trim() }) : null);

      if (existing) {
        existing.name = name;
        if (c.email) existing.email = c.email.trim().toLowerCase();
        if (c.phone) existing.phone = c.phone.trim();
        if (firebaseUid) existing.firebaseUid = firebaseUid;
        existing.address = {
          firstName: c.firstName,
          lastName: c.lastName,
          address: c.address,
          apartment: c.apartment,
          city: c.city,
          state: c.state,
          pinCode: c.pinCode,
          phone: c.phone,
          country: c.country || "IN",
        };
        existing.city = c.city;
        existing.state = c.state;
        existing.pincode = c.pinCode;
        existing.lastVisit = new Date();
        if (!existing.source) existing.source = "checkout";
        await existing.save();
        customerId = existing._id.toString();
      } else {
        const created = await Customer.create({
          email: c.email?.trim().toLowerCase(),
          phone: c.phone.trim(),
          name,
          firebaseUid,
          source: "checkout",
          address: {
            firstName: c.firstName,
            lastName: c.lastName,
            address: c.address,
            apartment: c.apartment,
            city: c.city,
            state: c.state,
            pinCode: c.pinCode,
            phone: c.phone,
            country: c.country || "IN",
          },
          city: c.city,
          state: c.state,
          pincode: c.pinCode,
          firstVisit: new Date(),
          lastVisit: new Date(),
        });
        customerId = created._id.toString();
      }
    }

    const orderId = generateOrderId();

    const doc = await Order.create({
      orderId,
      customerId,
      firebaseUid,
      customer: {
        name,
        email: c.email,
        phone: c.phone,
        address: c.address,
        apartment: c.apartment,
        city: c.city,
        state: c.state,
        pinCode: c.pinCode,
        country: c.country || "IN",
      },
      items: lines.map((line) => ({
        productId: line.productId,
        slug: line.slug,
        name: line.name,
        image: line.image,
        size: line.size,
        color: line.color,
        quantity: line.quantity,
        price: line.price,
        salePrice: line.salePrice ?? undefined,
      })),
      subtotal: totals.subtotal,
      discount: totals.discountAmount,
      shipping: totals.shipping,
      codCharge: totals.codCharge,
      prepaidDiscount: totals.prepaidDiscount,
      total: totals.total,
      paymentMethod,
      paymentStatus,
      razorpayOrderId,
      razorpayPaymentId,
      couponCode: coupon?.code,
      status: "Confirmation Pending",
    });

    if (coupon?.code) {
      await Coupon.updateOne(
        { code: coupon.code },
        { $inc: { usedCount: 1 } }
      );
    }

    if (customerId) {
      await Customer.findByIdAndUpdate(customerId, {
        $inc: { totalOrders: 1, totalSpent: totals.total },
        $set: { lastPurchase: new Date() },
      });
    }

    // Mark synced carts purchased
    const cartFilter: Record<string, unknown> = {};
    if (firebaseUid) cartFilter.firebaseUid = firebaseUid;
    else if (c.email) cartFilter.email = c.email.trim().toLowerCase();
    if (Object.keys(cartFilter).length) {
      await Cart.updateMany(cartFilter, {
        $set: { status: "purchased", lastUpdated: new Date() },
      });
    }

    const orderDto = toOrder(doc.toObject());

    void sendOrderPlaced({
      email: c.email || orderDto.customer.email,
      phone: c.phone || orderDto.customer.phone,
      name,
      orderId,
      total: totals.total,
      customerId,
    }).catch((e) => console.error("[order_placed]", e));

    return jsonCreated({
      order: orderDto,
      amountPaidNow: totals.amountToPayNow,
      payOnDelivery:
        paymentMethod === "partial"
          ? totals.total - totals.advanceAmount
          : paymentMethod === "cod"
            ? totals.total
            : 0,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
