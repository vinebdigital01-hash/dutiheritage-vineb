import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const PrepaidDiscountSchema = new Schema(
  {
    type: { type: String, enum: ["FLAT", "PERCENT"], default: "FLAT" },
    value: { type: Number, default: 0 },
  },
  { _id: false }
);

const CodSettingsSchema = new Schema(
  {
    _id: { type: String, default: "cod" },
    codEnabled: { type: Boolean, default: true },
    codMode: {
      type: String,
      enum: ["ALL_INDIA", "CITY_LIST", "PINCODE_LIST"],
      default: "PINCODE_LIST",
    },
    codCities: { type: [String], default: [] },
    codPincodes: { type: [String], default: [] },
    /** Prefixes like "1100" for demo-style matching */
    codPrefixes: { type: [String], default: [] },
    codExtraCharge: { type: Number, default: 49 },
    prepaidDiscount: {
      type: PrepaidDiscountSchema,
      default: () => ({ type: "FLAT", value: 50 }),
    },
    partialCodAdvance: { type: Number, default: 199 },
    freeShippingAbove: { type: Number, default: 999 },
    flatShippingFee: { type: Number, default: 99 },
  },
  { timestamps: true }
);

export type SettingsDocument = InferSchemaType<typeof CodSettingsSchema> & {
  _id: string;
};

export const Settings: Model<SettingsDocument> =
  (models.Settings as Model<SettingsDocument>) ||
  model<SettingsDocument>("Settings", CodSettingsSchema);
