import { connectDB } from "@/lib/mongodb";
import { StoreSettings } from "@/models";
import { getStoreIdentity } from "@/lib/store-identity";

export type StoreSettingsDTO = {
  legalName: string;
  gstin: string;
  address: string;
  state: string;
  stateCode: string;
  supportEmail: string;
  supportPhone: string;
  defaultHsn: string;
  defaultGstRate: number;
  prepaidEnabled: boolean;
  seoTitle: string;
  seoDescription: string;
  flags: {
    reviews: boolean;
    wishlist: boolean;
    whatsappWidget: boolean;
  };
};

function envIdentity() {
  return getStoreIdentity();
}

export function defaultStoreSettings(): StoreSettingsDTO {
  const id = envIdentity();
  return {
    legalName: id.legalName,
    gstin: id.gstin,
    address: id.address,
    state: id.state,
    stateCode: id.stateCode,
    supportEmail: id.supportEmail,
    supportPhone: id.supportPhone,
    defaultHsn: "6104",
    defaultGstRate: 5,
    prepaidEnabled: true,
    seoTitle: "",
    seoDescription: "",
    flags: { reviews: true, wishlist: true, whatsappWidget: true },
  };
}

export async function getStoreSettings(): Promise<StoreSettingsDTO> {
  const defaults = defaultStoreSettings();
  if (!process.env.MONGODB_URI) return defaults;
  try {
    await connectDB();
    const doc = await StoreSettings.findById("store").lean();
    if (!doc) return defaults;
    return {
      legalName: doc.legalName || defaults.legalName,
      gstin: doc.gstin || defaults.gstin,
      address: doc.address || defaults.address,
      state: doc.state || defaults.state,
      stateCode: doc.stateCode || defaults.stateCode,
      supportEmail: doc.supportEmail || defaults.supportEmail,
      supportPhone: doc.supportPhone || defaults.supportPhone,
      defaultHsn: doc.defaultHsn || defaults.defaultHsn,
      defaultGstRate: Number(doc.defaultGstRate ?? defaults.defaultGstRate),
      prepaidEnabled: doc.prepaidEnabled !== false,
      seoTitle: doc.seoTitle || "",
      seoDescription: doc.seoDescription || "",
      flags: {
        reviews: doc.flags?.reviews !== false,
        wishlist: doc.flags?.wishlist !== false,
        whatsappWidget: doc.flags?.whatsappWidget !== false,
      },
    };
  } catch {
    return defaults;
  }
}
