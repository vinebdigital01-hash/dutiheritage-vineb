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

    return new Response(JSON.stringify({
      ...settings,
      razorpayEnabled: isRazorpayConfigured(),
    }), { status: 200, headers: { "Content-Type": "application/json", "Cache-Control": "public, s-maxage=300" } });
  } catch (error) {
    return handleApiError(error);
  }
}
