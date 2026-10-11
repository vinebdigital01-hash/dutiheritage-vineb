import mongoose, { Schema, Document } from "mongoose";

export interface IOtpSession extends Document {
  phone: string;
  otp: string;
  attempts: number;
  createdAt: Date;
  expiresAt: Date;
}

const OtpSessionSchema = new Schema<IOtpSession>({
  phone: { type: String, required: true, index: true },
  otp: { type: String, required: true },
  attempts: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, required: true, expires: 0 },
});

export const OtpSession = mongoose.models.OtpSession || mongoose.model<IOtpSession>("OtpSession", OtpSessionSchema);
