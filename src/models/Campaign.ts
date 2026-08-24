import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const CampaignStatsSchema = new Schema(
  {
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
  },
  { _id: false }
);

const CampaignSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    channel: {
      type: String,
      enum: ["email", "whatsapp"],
      required: true,
      index: true,
    },
    groupId: { type: Schema.Types.ObjectId, ref: "CustomerGroup", index: true },
    groupName: { type: String },
    subject: { type: String },
    body: { type: String },
    templateName: { type: String },
    status: {
      type: String,
      enum: ["draft", "scheduled", "sent", "failed"],
      default: "sent",
      index: true,
    },
    scheduledAt: { type: Date },
    sentAt: { type: Date },
    stats: { type: CampaignStatsSchema, default: () => ({}) },
    createdBy: { type: String },
  },
  { timestamps: true }
);

export type CampaignDocument = InferSchemaType<typeof CampaignSchema> & {
  _id: Schema.Types.ObjectId;
};

export const Campaign: Model<CampaignDocument> =
  (models.Campaign as Model<CampaignDocument>) ||
  model<CampaignDocument>("Campaign", CampaignSchema);
