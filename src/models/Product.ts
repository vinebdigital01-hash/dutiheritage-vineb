import { Schema, models, model, type InferSchemaType, type Model } from "mongoose";

const OfferSchema = new Schema(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    code: { type: String },
  },
  { _id: false }
);

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    price: { type: Number, required: true, min: 0 },
    salePrice: { type: Number, default: null, min: 0 },
    description: { type: String, default: "" },
    collectionId: { type: String, required: true, index: true },
    image: { type: String, required: true },
    images: { type: [String], default: [] },
    sizes: { type: [String], default: [] },
    colors: { type: [String], default: [] },
    tags: { type: [String], default: [] },
    badge: { type: String },
    seoTitle: { type: String },
    seoDescription: { type: String },
    boughtLast7Days: { type: Number, default: 0 },
    videoUrls: { type: [String], default: [] },
    offers: { type: [OfferSchema], default: [] },
    codAvailable: { type: Boolean, default: true },
    isPartialCOD: { type: Boolean, default: false },
    partialCODAdvance: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    lastEditedBy: { type: String },
    inventory: {
      type: [{
        size: { type: String, required: true },
        stock: { type: Number, required: true, default: 0 },
        sku: { type: String }
      }],
      default: []
    },
    trackInventory: { type: Boolean, default: false },
    lowStockThreshold: { type: Number, default: 3 },
    stockStatus: { type: String, enum: ["in_stock", "low_stock", "out_of_stock"], default: "in_stock" },
    hsn: { type: String, default: "6104" },
    gstRate: { type: Number, default: 5, min: 0, max: 28 },

  },
  { timestamps: true }
);

ProductSchema.index({ name: "text", description: "text", tags: "text" });

ProductSchema.index({ isActive: 1, createdAt: 1 });
ProductSchema.index({ collectionId: 1, isActive: 1, createdAt: 1 });


export type ProductDocument = InferSchemaType<typeof ProductSchema> & {
  _id: Schema.Types.ObjectId;
};

export const Product: Model<ProductDocument> =
  (models.Product as Model<ProductDocument>) ||
  model<ProductDocument>("Product", ProductSchema);
