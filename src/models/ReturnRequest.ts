import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

export const RETURN_STATUSES = ["requested", "approved", "rejected", "restocked"] as const;
export type ReturnStatus = (typeof RETURN_STATUSES)[number];

const ReturnItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    name: { type: String, required: true },
    image: { type: String },
    size: { type: String },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const ReturnRequestSchema = new Schema(
  {
    orderId: { type: String, required: true, index: true },
    orderMongoId: { type: String, index: true },
    firebaseUid: { type: String, index: true },
    customerName: { type: String },
    customerPhone: { type: String },
    type: { type: String, enum: ["return", "exchange"], default: "return" },
    status: {
      type: String,
      enum: RETURN_STATUSES,
      default: "requested",
      index: true,
    },
    source: { type: String, enum: ["customer", "staff"], default: "customer" },
    reason: { type: String, default: "" },
    rejectReason: { type: String, default: "" },
    items: { type: [ReturnItemSchema], required: true },
    refundAmount: { type: Number, default: 0 },
    decidedBy: { type: String },
    restockedAt: { type: Date },
  },
  { timestamps: true }
);

ReturnRequestSchema.index({ status: 1, createdAt: -1 });

export type ReturnRequestDocument = InferSchemaType<typeof ReturnRequestSchema> & {
  _id: Schema.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};

export const ReturnRequest: Model<ReturnRequestDocument> =
  (models.ReturnRequest as Model<ReturnRequestDocument>) ||
  model<ReturnRequestDocument>("ReturnRequest", ReturnRequestSchema);
