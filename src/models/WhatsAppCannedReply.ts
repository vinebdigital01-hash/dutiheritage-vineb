import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const WhatsAppCannedReplySchema = new Schema(
  {
    title: { type: String, required: true },
    body: { type: String, required: true },
    createdBy: { type: String },
  },
  { timestamps: true }
);

export type WhatsAppCannedReplyDocument = InferSchemaType<typeof WhatsAppCannedReplySchema> & {
  _id: Schema.Types.ObjectId;
};

export const WhatsAppCannedReply: Model<WhatsAppCannedReplyDocument> =
  (models.WhatsAppCannedReply as Model<WhatsAppCannedReplyDocument>) ||
  model<WhatsAppCannedReplyDocument>("WhatsAppCannedReply", WhatsAppCannedReplySchema);
