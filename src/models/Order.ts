import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

export const ORDER_STATUSES = [
  "Confirmation Pending",
  "Confirmed",
  "Packed",
  "Shipped",
  "In Transit",
  "Delivered",
  "Cancelled",
  "Returned",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

const OrderItemSchema = new Schema(
  {
    productId: { type: String, required: true },
    slug: { type: String },
    name: { type: String, required: true },
    image: { type: String },
    size: { type: String },
    color: { type: String },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number },
  },
  { _id: false }
);

const CustomerSnapshotSchema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    apartment: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pinCode: { type: String, required: true },
    country: { type: String, default: "IN" },
  },
  { _id: false }
);

const TrackingInfoSchema = new Schema(
  {
    awb: String,
    courier: String,
    trackingUrl: String,
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    orderId: { type: String, required: true, unique: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", index: true },
    firebaseUid: { type: String, index: true },
    customer: { type: CustomerSnapshotSchema, required: true },
    items: { type: [OrderItemSchema], required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    shipping: { type: Number, default: 0 },
    codCharge: { type: Number, default: 0 },
    prepaidDiscount: { type: Number, default: 0 },
    total: { type: Number, required: true },
    paymentMethod: {
      type: String,
      enum: ["prepaid", "cod", "partial"],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "partially_paid", "failed", "refunded"],
      default: "pending",
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    couponCode: { type: String },
    status: {
      type: String,
      enum: ORDER_STATUSES,
      default: "Confirmation Pending",
      index: true,
    },
    trackingInfo: { type: TrackingInfoSchema },
    notes: { type: String },
  },
  { timestamps: true }
);

export type OrderDocument = InferSchemaType<typeof OrderSchema> & {
  _id: Schema.Types.ObjectId;
};

export const Order: Model<OrderDocument> =
  (models.Order as Model<OrderDocument>) ||
  model<OrderDocument>("Order", OrderSchema);
