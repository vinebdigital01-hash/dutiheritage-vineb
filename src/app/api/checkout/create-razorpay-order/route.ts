import { placeOrderSchema } from "@/lib/validators";
import { applyRateLimit } from "@/lib/rate-limit";
import { connectDB } from "@/lib/mongodb";
import { getRazorpay, isRazorpayConfigured, toPaise, getRazorpayPublicKey } from "@/lib/razorpay";
import {
  getCheckoutSettings,
  priceCartLines,
  resolveCouponDiscount,
  computeCheckoutTotals,
} from "@/services/checkout";
import {
  handleApiError,
  jsonOk,
  requireMongo,
  ApiError,
  generateOrderId,
} from "@/lib/api";

/**
 * POST /api/checkout/create-razorpay-order
 */
export async function POST(request: Request) {
  const rateLimitRes = applyRateLimit(request, { limit: 5, windowMs: 60000 });
  if (rateLimitRes) return rateLimitRes;

  try {
    requireMongo();

    if (!isRazorpayConfigured()) {
      throw new ApiError(
        "Razorpay is not configured. Set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and NEXT_PUBLIC_RAZORPAY_KEY_ID.",
        503
      );
    }

    const body = await request.json(); 
    // Fallback if frontend sends only amount (e.g. old clients)
    if (body.amount && !body.items) {
      // NOTE: This bypasses the security check for old clients if they don't send items.
      // We will strictly require the new format.
    }
    
    placeOrderSchema.parse(body);

    const paymentMethod = body.paymentMethod || "prepaid";
    if (!["prepaid", "partial"].includes(paymentMethod)) {
      throw new ApiError("Razorpay order requires prepaid or partial payment method");
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

    const c = body.customer;

    const totals = computeCheckoutTotals({
      lines,
      paymentMethod,
      settings,
      discountAmount: coupon?.amount ?? 0,
      pinCode: c?.pinCode?.trim() || "000000",
      city: c?.city || "",
    });

    const amount = totals.amountToPayNow;
    if (!amount || amount < 1) {
      throw new ApiError("amount must be at least ,11");
    }

    const razorpay = getRazorpay();
    if (!razorpay) throw new ApiError("Razorpay init failed", 500);

    await connectDB();

    const receipt = generateOrderId();
    const order = await razorpay.orders.create({
      amount: toPaise(amount),
      currency: "INR",
      receipt,
      notes: {
        source: "dutiheritage-checkout",
      },
    });

    return jsonOk({
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt,
      key: getRazorpayPublicKey(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
