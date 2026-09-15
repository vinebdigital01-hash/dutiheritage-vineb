import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const CouponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountType: {
      type: String,
      enum: ["PERCENT", "FLAT", "BUY_X_PERCENT", "BUY_X_GET_Y_FREE"],
      required: true,
    },
    discountValue: { type: Number, required: true, min: 0 },
    scope: {
      type: String,
      enum: ["ALL_PRODUCTS", "SPECIFIC_CATEGORY", "SPECIFIC_PRODUCTS"],
      default: "ALL_PRODUCTS",
    },
    targetIds: { type: [String], default: [] },
    minQuantity: { type: Number, default: 0 },
    freeQuantity: { type: Number, default: 0 },
    usageLimit: { type: Number },
    perUserLimit: { type: Number },
    minOrderAmount: { type: Number, default: 0 },
    usedCount: { type: Number, default: 0 },
    active: { type: Boolean, default: true },
    expiresAt: { type: Date },
  },
  { timestamps: true }
);

export type CouponDocument = InferSchemaType<typeof CouponSchema> & {
  _id: Schema.Types.ObjectId;
};

export const Coupon: Model<CouponDocument> =
  (models.Coupon as Model<CouponDocument>) ||
  model<CouponDocument>("Coupon", CouponSchema);
