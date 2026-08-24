import { handleApiError, jsonOk, requireMongo } from "@/lib/api";
import { getCheckoutSettings } from "@/services/checkout";
import { isRazorpayConfigured } from "@/lib/razorpay";

/**
 * GET /api/checkout/config
 */
export async function GET() {
  try {
    requireMongo();
    const settings = await getCheckoutSettings();

    return jsonOk({
      ...settings,
      razorpayEnabled: isRazorpayConfigured(),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
