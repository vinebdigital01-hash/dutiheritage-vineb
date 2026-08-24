import { connectDB } from "@/lib/mongodb";
import { getRazorpay, isRazorpayConfigured, toPaise, getRazorpayPublicKey } from "@/lib/razorpay";
import {
  handleApiError,
  jsonOk,
  requireMongo,
  ApiError,
  generateOrderId,
} from "@/lib/api";

/**
 * POST /api/checkout/create-razorpay-order
 * Body: { amount: number } // INR rupees to charge now
 */
export async function POST(request: Request) {
  try {
    requireMongo();

    if (!isRazorpayConfigured()) {
      throw new ApiError(
        "Razorpay is not configured. Set RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, and NEXT_PUBLIC_RAZORPAY_KEY_ID.",
        503
      );
    }

    const body = await request.json();
    const amount = Number(body.amount);
    if (!amount || amount < 1) {
      throw new ApiError("amount must be at least ₹1");
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
