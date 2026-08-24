import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const CartItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    size: { type: String },
    color: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number },
    name: { type: String },
    image: { type: String },
  },
  { _id: false }
);

const CartSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", index: true },
    firebaseUid: { type: String, index: true },
    email: { type: String, lowercase: true, index: true },
    phone: { type: String, index: true },
    sessionId: { type: String, index: true },
    items: { type: [CartItemSchema], default: [] },
    status: {
      type: String,
      enum: ["active", "abandoned", "emailed", "purchased"],
      default: "active",
      index: true,
    },
    lastUpdated: { type: Date, default: Date.now, index: true },
  },
  { timestamps: true }
);

export type CartDocument = InferSchemaType<typeof CartSchema> & {
  _id: Schema.Types.ObjectId;
};

export const Cart: Model<CartDocument> =
  (models.Cart as Model<CartDocument>) ||
  model<CartDocument>("Cart", CartSchema);
