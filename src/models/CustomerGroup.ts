import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const FilterSchema = new Schema(
  {
    field: { type: String, required: true },
    operator: { type: String, required: true },
    value: { type: Schema.Types.Mixed },
  },
  { _id: false }
);

const CustomerGroupSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, trim: true },
    type: {
      type: String,
      enum: ["smart", "manual"],
      default: "manual",
      index: true,
    },
    filters: { type: [FilterSchema], default: [] },
    memberIds: {
      type: [Schema.Types.ObjectId],
      ref: "Customer",
      default: [],
    },
    memberCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export type CustomerGroupDocument = InferSchemaType<
  typeof CustomerGroupSchema
> & {
  _id: Schema.Types.ObjectId;
};

export const CustomerGroup: Model<CustomerGroupDocument> =
  (models.CustomerGroup as Model<CustomerGroupDocument>) ||
  model<CustomerGroupDocument>("CustomerGroup", CustomerGroupSchema);
