import { handleApiError, requireMongo } from "@/lib/api";
import { getCheckoutSettings } from "@/services/checkout";
import { isRazorpayConfigured } from "@/lib/razorpay";
import { getStoreSettings } from "@/lib/store-settings";

/**
 * GET /api/checkout/config
 */
export async function GET() {
  try {
    requireMongo();
    const [settings, store] = await Promise.all([
      getCheckoutSettings(),
      getStoreSettings(),
    ]);

    return new Response(
      JSON.stringify({
        ...settings,
        razorpayEnabled: isRazorpayConfigured() && store.prepaidEnabled,
        prepaidEnabled: store.prepaidEnabled,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=60",
        },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}
