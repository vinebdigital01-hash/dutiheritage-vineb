import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const StockMovementSchema = new Schema(
  {
    productId: { type: String, required: true, index: true },
    productName: { type: String },
    size: { type: String, default: "" },
    delta: { type: Number, required: true },
    stockAfter: { type: Number },
    reason: {
      type: String,
      enum: ["order", "cancel", "return", "admin", "csv"],
      required: true,
    },
    orderId: { type: String },
    actor: { type: String },
  },
  { timestamps: true }
);

StockMovementSchema.index({ createdAt: -1 });

export type StockMovementDocument = InferSchemaType<typeof StockMovementSchema> & {
  _id: Schema.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};

export const StockMovement: Model<StockMovementDocument> =
  (models.StockMovement as Model<StockMovementDocument>) ||
  model<StockMovementDocument>("StockMovement", StockMovementSchema);
