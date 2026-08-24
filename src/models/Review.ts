import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const ReviewSchema = new Schema(
  {
    productId: { type: String, required: true, index: true },
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "" },
    images: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["approved", "pending", "rejected"],
      default: "pending",
      index: true,
    },
    isVerifiedPurchase: { type: Boolean, default: false },
    orderId: { type: String },
  },
  { timestamps: true }
);

ReviewSchema.index({ productId: 1, userId: 1 }, { unique: true });

export type ReviewDocument = InferSchemaType<typeof ReviewSchema> & {
  _id: Schema.Types.ObjectId;
};

export const Review: Model<ReviewDocument> =
  (models.Review as Model<ReviewDocument>) ||
  model<ReviewDocument>("Review", ReviewSchema);
