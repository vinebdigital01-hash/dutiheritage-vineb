import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const StockNotifySchema = new Schema(
  {
    productId: { type: String, required: true, index: true },
    productName: { type: String, default: "" },
    size: { type: String, required: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    notifiedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

StockNotifySchema.index({ productId: 1, size: 1, email: 1 }, { unique: true });

export type StockNotifyDocument = InferSchemaType<typeof StockNotifySchema> & {
  _id: Schema.Types.ObjectId;
};

export const StockNotify: Model<StockNotifyDocument> =
  (models.StockNotify as Model<StockNotifyDocument>) ||
  model<StockNotifyDocument>("StockNotify", StockNotifySchema);
