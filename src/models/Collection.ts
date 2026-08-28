import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const CollectionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    productCount: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);


CollectionSchema.index({ isActive: 1, createdAt: 1 });

export type CollectionDocument = InferSchemaType<typeof CollectionSchema> & {
  _id: Schema.Types.ObjectId;
};

export const Collection: Model<CollectionDocument> =
  (models.Collection as Model<CollectionDocument>) ||
  model<CollectionDocument>("Collection", CollectionSchema);
