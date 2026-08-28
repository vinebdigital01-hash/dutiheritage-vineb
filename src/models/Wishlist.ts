import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const WishlistSchema = new Schema(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", index: true },
    firebaseUid: { type: String, required: true, index: true },
    email: { type: String, lowercase: true, index: true },
    productId: { type: String, required: true, index: true },
  },
  { timestamps: true }
);

WishlistSchema.index({ firebaseUid: 1, productId: 1 }, { unique: true });

export type WishlistDocument = InferSchemaType<typeof WishlistSchema> & {
  _id: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
};

export const Wishlist: Model<WishlistDocument> =
  (models.Wishlist as Model<WishlistDocument>) ||
  model<WishlistDocument>("Wishlist", WishlistSchema);
