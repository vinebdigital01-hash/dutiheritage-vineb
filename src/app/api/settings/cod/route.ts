import { connectDB } from "@/lib/mongodb";
import { Settings } from "@/models";
import { requireAuth } from "@/lib/auth";
import { getCheckoutSettings } from "@/services/checkout";
import {
  handleApiError,
  jsonOk,
  requireMongo,
  ApiError,
} from "@/lib/api";

/**
 * GET /api/settings/cod — public checkout-safe settings
 * PUT /api/settings/cod — admin update
 */
export async function GET() {
  try {
    requireMongo();
    const settings = await getCheckoutSettings();
    return jsonOk({ settings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
    await connectDB();

    const body = await request.json();

    const update: Record<string, unknown> = {};
    if (body.codEnabled !== undefined) update.codEnabled = Boolean(body.codEnabled);
    if (body.codMode !== undefined) {
      if (!["ALL_INDIA", "CITY_LIST", "PINCODE_LIST"].includes(body.codMode)) {
        throw new ApiError("Invalid codMode");
      }
      update.codMode = body.codMode;
    }
    if (body.codCities !== undefined) update.codCities = body.codCities;
    if (body.codPincodes !== undefined) update.codPincodes = body.codPincodes;
    if (body.codPrefixes !== undefined) update.codPrefixes = body.codPrefixes;
    if (body.codExtraCharge !== undefined) {
      update.codExtraCharge = Number(body.codExtraCharge);
    }
    if (body.prepaidDiscount !== undefined) {
      update.prepaidDiscount = {
        type: body.prepaidDiscount.type || "FLAT",
        value: Number(body.prepaidDiscount.value) || 0,
      };
    }
    if (body.partialCodAdvance !== undefined) {
      update.partialCodAdvance = Number(body.partialCodAdvance);
    }
    if (body.freeShippingAbove !== undefined) {
      update.freeShippingAbove = Number(body.freeShippingAbove);
    }
    if (body.flatShippingFee !== undefined) {
      update.flatShippingFee = Number(body.flatShippingFee);
    }

    const doc = await Settings.findOneAndUpdate(
      { _id: "cod" },
      { $set: update },
      { upsert: true, new: true }
    ).lean();

    const settings = await getCheckoutSettings();
    return jsonOk({ settings, raw: doc });
  } catch (error) {
    return handleApiError(error);
  }
}
