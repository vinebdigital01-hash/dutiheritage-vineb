import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

/**
 * Dedup log for automation sends.
 * Compound unique on { flow, recipientKey, stage }.
 */
const AutomationLogSchema = new Schema(
  {
    flow: { type: String, required: true, index: true },
    stage: { type: String, required: true, default: "default" },
    /** email or phone or firebaseUid used for dedup */
    recipientKey: { type: String, required: true, index: true },
    customerId: { type: String, index: true },
    orderId: { type: String, index: true },
    cartId: { type: String, index: true },
    channel: {
      type: String,
      enum: ["email", "whatsapp", "both"],
      required: true,
    },
    status: {
      type: String,
      enum: ["sent", "skipped", "failed"],
      default: "sent",
    },
    detail: { type: String },
    meta: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

AutomationLogSchema.index(
  { flow: 1, recipientKey: 1, stage: 1 },
  { unique: true }
);

export type AutomationLogDocument = InferSchemaType<typeof AutomationLogSchema> & {
  _id: Schema.Types.ObjectId;
};

export const AutomationLog: Model<AutomationLogDocument> =
  (models.AutomationLog as Model<AutomationLogDocument>) ||
  model<AutomationLogDocument>("AutomationLog", AutomationLogSchema);
