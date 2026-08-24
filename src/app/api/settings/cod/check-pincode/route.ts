import { handleApiError, jsonOk, requireMongo } from "@/lib/api";
import {
  getCheckoutSettings,
  isCodAvailableForPin,
} from "@/services/checkout";

/**
 * POST /api/settings/cod/check-pincode
 * Body: { pinCode: string, city?: string }
 * (Handoff path — same behavior as /api/checkout/check-pincode)
 */
export async function POST(request: Request) {
  try {
    requireMongo();
    const body = (await request.json()) as { pinCode?: string; city?: string };
    const pin = (body.pinCode || "").trim();

    if (pin.length !== 6) {
      return jsonOk({
        available: false,
        message: "Enter a valid 6-digit pincode",
      });
    }

    const settings = await getCheckoutSettings();
    const available = isCodAvailableForPin(pin, settings, body.city);

    return jsonOk({
      available,
      message: available
        ? "COD is available for your area"
        : "COD is not available for your pincode",
      codExtraCharge: settings.codExtraCharge,
      partialCodAdvance: settings.partialCodAdvance,
      prepaidDiscount: settings.prepaidDiscount,
      freeShippingAbove: settings.freeShippingAbove,
      flatShippingFee: settings.flatShippingFee,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
