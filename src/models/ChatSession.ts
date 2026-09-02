import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const NegotiationSchema = new Schema(
  {
    productSlug: String,
    currentStep: { type: Number, default: 0 },
    maxDiscount: Number,
    offeredDiscount: Number,
    couponCode: String,
    expiresAt: Date,
  },
  { _id: false }
);

const ChatSessionSchema = new Schema(
  {
    phone: { type: String, required: true, unique: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer" },
    customerName: { type: String },
    currentState: { type: String, default: "IDLE" },
    isVerified: { type: Boolean, default: false },
    mode: { type: String, enum: ["bot", "human"], default: "bot" },
    lastMessageAt: { type: Date },
    unreadCount: { type: Number, default: 0 },
    negotiation: NegotiationSchema,
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

export type ChatSessionDocument = InferSchemaType<typeof ChatSessionSchema> & {
  _id: Schema.Types.ObjectId;
};

export const ChatSession: Model<ChatSessionDocument> =
  (models.ChatSession as Model<ChatSessionDocument>) ||
  model<ChatSessionDocument>("ChatSession", ChatSessionSchema);
