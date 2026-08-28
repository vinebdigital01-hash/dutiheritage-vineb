import { Schema, model, models, InferSchemaType, Model } from "mongoose";

const SystemLogSchema = new Schema(
  {
    level: { type: String, enum: ["info", "warning", "error"], default: "error" },
    source: { type: String, required: true },
    message: { type: String, required: true },
    details: { type: Schema.Types.Mixed },
    path: { type: String },
    ip: { type: String },
    status: { type: String, enum: ["open", "fixed"], default: "open" },
  },
  { timestamps: true }
);

SystemLogSchema.index({ createdAt: -1 });
SystemLogSchema.index({ level: 1, createdAt: -1 });

export type SystemLogDocument = InferSchemaType<typeof SystemLogSchema> & {
  _id: Schema.Types.ObjectId;
};

export const SystemLog: Model<SystemLogDocument> =
  (models.SystemLog as Model<SystemLogDocument>) ||
  model<SystemLogDocument>("SystemLog", SystemLogSchema);
