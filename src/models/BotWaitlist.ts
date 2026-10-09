import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const BotWaitlistSchema = new Schema(
  {
    phone: { type: String, required: true, index: true },
    productId: { type: String, required: true, index: true },
    productName: { type: String, default: "" },
    size: { type: String, default: "" },
    notifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

BotWaitlistSchema.index({ productId: 1, size: 1, phone: 1 }, { unique: true });

export type BotWaitlistDocument = InferSchemaType<typeof BotWaitlistSchema> & {
  _id: Schema.Types.ObjectId;
};

export const BotWaitlist: Model<BotWaitlistDocument> =
  (models.BotWaitlist as Model<BotWaitlistDocument>) ||
  model<BotWaitlistDocument>("BotWaitlist", BotWaitlistSchema);
