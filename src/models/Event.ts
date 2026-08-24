import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

export const TRACK_EVENTS = [
  "page_view",
  "product_view",
  "collection_view",
  "add_to_cart",
  "remove_from_cart",
  "checkout_start",
  "checkout_shipping",
  "checkout_payment",
  "purchase",
  "search",
] as const;

export type TrackEvent = (typeof TRACK_EVENTS)[number];

const EventSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", index: true },
    firebaseUid: { type: String, index: true },
    sessionId: { type: String, index: true },
    email: { type: String, lowercase: true, index: true, sparse: true },
    event: {
      type: String,
      enum: TRACK_EVENTS,
      required: true,
      index: true,
    },
    productId: { type: String, index: true, sparse: true },
    productName: { type: String },
    collectionId: { type: String, index: true, sparse: true },
    path: { type: String },
    referrer: { type: String },
    metadata: { type: Schema.Types.Mixed },
    durationMs: { type: Number },
    fbclid: { type: String },
  },
  { timestamps: true }
);

EventSchema.index({ createdAt: -1 });
EventSchema.index({ sessionId: 1, event: 1, createdAt: -1 });
EventSchema.index({ productId: 1, event: 1, createdAt: -1 });

export type EventDocument = InferSchemaType<typeof EventSchema> & {
  _id: Schema.Types.ObjectId;
};

export const Event: Model<EventDocument> =
  (models.Event as Model<EventDocument>) ||
  model<EventDocument>("Event", EventSchema);
