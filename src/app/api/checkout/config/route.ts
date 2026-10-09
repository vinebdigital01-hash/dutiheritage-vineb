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
        checkoutTimer: (store.flags as any)?.checkoutTimer !== false,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, max-age=0",
        },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

