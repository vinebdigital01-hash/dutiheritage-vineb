import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const FlagsSchema = new Schema(
  {
    reviews: { type: Boolean, default: true },
    wishlist: { type: Boolean, default: true },
    whatsappWidget: { type: Boolean, default: true },
  },
  { _id: false }
);

const StoreSettingsSchema = new Schema(
  {
    _id: { type: String, default: "store" },
    legalName: { type: String, default: "" },
    gstin: { type: String, default: "" },
    address: { type: String, default: "" },
    state: { type: String, default: "" },
    stateCode: { type: String, default: "" },
    supportEmail: { type: String, default: "" },
    supportPhone: { type: String, default: "" },
    defaultHsn: { type: String, default: "6104" },
    defaultGstRate: { type: Number, default: 5, min: 0, max: 28 },
    prepaidEnabled: { type: Boolean, default: true },
    seoTitle: { type: String, default: "" },
    seoDescription: { type: String, default: "" },
    flags: { type: FlagsSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export type StoreSettingsDocument = InferSchemaType<typeof StoreSettingsSchema> & {
  _id: string;
};

export const StoreSettings: Model<StoreSettingsDocument> =
  (models.StoreSettings as Model<StoreSettingsDocument>) ||
  model<StoreSettingsDocument>("StoreSettings", StoreSettingsSchema);
