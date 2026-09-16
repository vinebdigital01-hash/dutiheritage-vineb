import { StoreSettings } from "@/models";
import { requireAuth } from "@/lib/auth";
import { SETTINGS_WRITE } from "@/lib/rbac";
import { connectDB } from "@/lib/mongodb";
import { handleApiError, jsonOk, requireMongo, ApiError } from "@/lib/api";
import { getStoreSettings } from "@/lib/store-settings";
import { logAdminAction } from "@/lib/admin-audit";

export async function GET(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
    const settings = await getStoreSettings();
    return jsonOk({ settings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    requireMongo();
    const authUser = await requireAuth(request, { admin: true, roles: SETTINGS_WRITE });
    await connectDB();
    const body = await request.json();

    const gstRate = body.defaultGstRate !== undefined ? Number(body.defaultGstRate) : undefined;
    if (gstRate !== undefined && (Number.isNaN(gstRate) || gstRate < 0 || gstRate > 28)) {
      throw new ApiError("defaultGstRate must be between 0 and 28");
    }

    const update: Record<string, unknown> = {};
    const strFields = [
      "legalName",
      "gstin",
      "address",
      "state",
      "stateCode",
      "supportEmail",
      "supportPhone",
      "defaultHsn",
      "seoTitle",
      "seoDescription",
    ] as const;
    for (const key of strFields) {
      if (body[key] !== undefined) update[key] = String(body[key] || "").trim();
    }
    if (gstRate !== undefined) update.defaultGstRate = gstRate;
    if (body.prepaidEnabled !== undefined) update.prepaidEnabled = Boolean(body.prepaidEnabled);
    if (body.flags && typeof body.flags === "object") {
      update.flags = {
        reviews: body.flags.reviews !== false,
        wishlist: body.flags.wishlist !== false,
        whatsappWidget: body.flags.whatsappWidget !== false,
      };
    }

    const current = await getStoreSettings();
    const next = { ...current, ...update, _id: "store" };
    await StoreSettings.findByIdAndUpdate("store", { $set: next }, { upsert: true, new: true });

    const settings = await getStoreSettings();
    await logAdminAction({
      request,
      actor: authUser,
      action: "update",
      resource: "settings",
      resourceId: "store",
      message: "Updated store settings",
    });
    return jsonOk({ settings });
  } catch (error) {
    return handleApiError(error);
  }
}
