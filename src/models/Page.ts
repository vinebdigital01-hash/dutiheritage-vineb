import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const PageSchema = new Schema(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    title: { type: String, required: true },
    content: { type: String, default: "" },
  },
  { timestamps: true }
);

export type PageDocument = InferSchemaType<typeof PageSchema> & {
  _id: Schema.Types.ObjectId;
};

export const Page: Model<PageDocument> =
  (models.Page as Model<PageDocument>) ||
  model<PageDocument>("Page", PageSchema);
