import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const OfflineClaimSchema = new Schema(
  {
    claimId: { type: String, required: true, unique: true, index: true, uppercase: true },
    productId: { type: String, required: true, index: true },
    productName: { type: String, default: "" },
    size: { type: String, required: true },
    price: { type: Number, default: 0 },
    isClaimed: { type: Boolean, default: false, index: true },
    claimedByPhone: { type: String, default: "" },
    orderId: { type: String, default: "" },
  },
  { timestamps: true }
);

export type OfflineClaimDocument = InferSchemaType<typeof OfflineClaimSchema> & {
  _id: Schema.Types.ObjectId;
};

export const OfflineClaim: Model<OfflineClaimDocument> =
  (models.OfflineClaim as Model<OfflineClaimDocument>) ||
  model<OfflineClaimDocument>("OfflineClaim", OfflineClaimSchema);
