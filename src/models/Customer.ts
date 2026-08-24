import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const AddressSchema = new Schema(
  {
    firstName: String,
    lastName: String,
    address: String,
    apartment: String,
    city: String,
    state: String,
    pinCode: String,
    phone: String,
    country: { type: String, default: "IN" },
  },
  { _id: false }
);

const CustomerSchema = new Schema(
  {
    email: { type: String, lowercase: true, trim: true, index: true, sparse: true },
    phone: { type: String, trim: true, index: true, sparse: true },
    name: { type: String, trim: true },
    firebaseUid: { type: String, unique: true, sparse: true, index: true },
    metaPixelId: { type: String },
    fbclid: { type: String },
    source: {
      type: String,
      enum: ["meta_pixel", "firebase", "checkout", "manual"],
      default: "firebase",
    },
    address: { type: AddressSchema },
    city: String,
    state: String,
    pincode: String,
    tags: { type: [String], default: [] },
    groupIds: { type: [Schema.Types.ObjectId], default: [] },
    totalOrders: { type: Number, default: 0 },
    totalSpent: { type: Number, default: 0 },
    avgOrderValue: { type: Number, default: 0 },
    ltvScore: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "LOW",
    },
    firstVisit: { type: Date },
    lastVisit: { type: Date },
    lastPurchase: { type: Date },
  },
  { timestamps: true }
);

CustomerSchema.index({ email: 1, phone: 1 });

export type CustomerDocument = InferSchemaType<typeof CustomerSchema> & {
  _id: Schema.Types.ObjectId;
};

export const Customer: Model<CustomerDocument> =
  (models.Customer as Model<CustomerDocument>) ||
  model<CustomerDocument>("Customer", CustomerSchema);
