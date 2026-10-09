import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const WhatsAppAbandonedCheckoutSchema = new Schema(
  {
    phone: { type: String, required: true, index: true },
    productId: { type: String, default: "" },
    productName: { type: String, default: "" },
    meta: { type: Schema.Types.Mixed },
    notifiedAt: { type: Date, default: null },
    convertedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

WhatsAppAbandonedCheckoutSchema.index({ phone: 1, notifiedAt: 1, createdAt: 1 });

export type WhatsAppAbandonedCheckoutDocument = InferSchemaType<
  typeof WhatsAppAbandonedCheckoutSchema
> & {
  _id: Schema.Types.ObjectId;
};

export const WhatsAppAbandonedCheckout: Model<WhatsAppAbandonedCheckoutDocument> =
  (models.WhatsAppAbandonedCheckout as Model<WhatsAppAbandonedCheckoutDocument>) ||
  model<WhatsAppAbandonedCheckoutDocument>(
    "WhatsAppAbandonedCheckout",
    WhatsAppAbandonedCheckoutSchema
  );
