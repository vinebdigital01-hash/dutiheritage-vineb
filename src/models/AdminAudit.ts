import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const AdminAuditSchema = new Schema(
  {
    actor: { type: String, required: true, index: true },
    role: { type: String },
    action: { type: String, required: true, index: true },
    resource: { type: String, required: true, index: true },
    resourceId: { type: String, index: true },
    message: { type: String },
    path: { type: String },
    ip: { type: String },
  },
  { timestamps: true }
);

AdminAuditSchema.index({ createdAt: -1 });

export type AdminAuditDocument = InferSchemaType<typeof AdminAuditSchema> & {
  _id: Schema.Types.ObjectId;
  createdAt?: Date;
};

export const AdminAudit: Model<AdminAuditDocument> =
  (models.AdminAudit as Model<AdminAuditDocument>) ||
  model<AdminAuditDocument>("AdminAudit", AdminAuditSchema);
