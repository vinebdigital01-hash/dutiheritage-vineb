import mongoose, { Schema, Document } from "mongoose";

export interface RestockRequestDocument extends Document {
  email: string;
  productId: string;
  productName: string;
  size?: string;
  status: "pending" | "notified";
  createdAt: Date;
  updatedAt: Date;
}

const RestockRequestSchema = new Schema<RestockRequestDocument>(
  {
    email: { type: String, required: true },
    productId: { type: String, required: true },
    productName: { type: String, required: true },
    size: { type: String },
    status: { type: String, enum: ["pending", "notified"], default: "pending" },
  },
  { timestamps: true }
);

export const RestockRequest =
  mongoose.models.RestockRequest ||
  mongoose.model<RestockRequestDocument>("RestockRequest", RestockRequestSchema);
