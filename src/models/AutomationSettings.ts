import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const FlowSchema = new Schema(
  {
    enabled: { type: Boolean, default: true },
  },
  { _id: false }
);

const AutomationSettingsSchema = new Schema(
  {
    _id: { type: String, default: "automations" },
    welcome: { type: FlowSchema, default: () => ({ enabled: true }) },
    order_placed: { type: FlowSchema, default: () => ({ enabled: true }) },
    order_shipped: { type: FlowSchema, default: () => ({ enabled: true }) },
    order_delivered: { type: FlowSchema, default: () => ({ enabled: true }) },
    cart_abandoned: { type: FlowSchema, default: () => ({ enabled: true }) },
    post_purchase_review: {
      type: FlowSchema,
      default: () => ({ enabled: true }),
    },
    winback: { type: FlowSchema, default: () => ({ enabled: true }) },
    wishlist_reminder: { type: FlowSchema, default: () => ({ enabled: true }) },
  },
  { timestamps: true }
);

export type AutomationSettingsDocument = InferSchemaType<
  typeof AutomationSettingsSchema
> & { _id: string };

export const AutomationSettings: Model<AutomationSettingsDocument> =
  (models.AutomationSettings as Model<AutomationSettingsDocument>) ||
  model<AutomationSettingsDocument>(
    "AutomationSettings",
    AutomationSettingsSchema
  );

export type AutomationFlowKey =
  | "welcome"
  | "order_placed"
  | "order_shipped"
  | "order_delivered"
  | "cart_abandoned"
  | "post_purchase_review"
  | "winback"
  | "wishlist_reminder";
