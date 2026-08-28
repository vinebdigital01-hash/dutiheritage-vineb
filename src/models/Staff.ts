import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

export const STAFF_ROLES = ["SUPERADMIN", "ADMIN", "MANAGER"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

const StaffSchema = new Schema(
  {
    email: { type: String, required: true, lowercase: true, trim: true, unique: true },
    name: { type: String, required: true, trim: true },
    role: { type: String, enum: STAFF_ROLES, required: true },
    active: { type: Boolean, default: true },
    addedBy: { type: String },
  },
  { timestamps: true }
);

export type StaffDocument = InferSchemaType<typeof StaffSchema> & {
  _id: Schema.Types.ObjectId;
};

export const Staff: Model<StaffDocument> =
  (models.Staff as Model<StaffDocument>) ||
  model<StaffDocument>("Staff", StaffSchema);
