import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const ChatMessageSchema = new Schema(
  {
    phone: { type: String, required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    direction: { type: String, enum: ["incoming", "outgoing", "admin"], required: true },
    messageType: { 
      type: String, 
      enum: ["text", "image", "product", "catalog", "template", "interactive"], 
      default: "text" 
    },
    body: { type: String },
    mediaUrl: { type: String },
    templateName: { type: String },
    metadata: { type: Schema.Types.Mixed },
    sentBy: { type: String, enum: ["bot", "admin", "customer", "automation"] },
    conversationState: { type: String },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ChatMessageSchema.index({ phone: 1, createdAt: 1 });

export type ChatMessageDocument = InferSchemaType<typeof ChatMessageSchema> & {
  _id: Schema.Types.ObjectId;
};

export const ChatMessage: Model<ChatMessageDocument> =
  (models.ChatMessage as Model<ChatMessageDocument>) ||
  model<ChatMessageDocument>("ChatMessage", ChatMessageSchema);
