import mongoose from "mongoose";
import { Product, Collection } from "@/types";
import {
  products as mockProducts,
  collections as mockCollections,
} from "@/data/mock-products";
import { connectDB } from "@/lib/mongodb";
import { Product as ProductModel, Collection as CollectionModel } from "@/models";
import { toProduct, toCollection } from "@/lib/mappers";

/**
 * DATABASE ACCESS LAYER (Repository Pattern)
 * ------------------------------------------
 * UI and pages call these functions only.
 * With MONGODB_URI set → MongoDB.
 * Without it → mock data (local demo / offline).
 */

function useMongo(): boolean {
  return Boolean(process.env.MONGODB_URI);
}

async function ensureDb() {
  await connectDB();
}

function isObjectId(id: string): boolean {
  return mongoose.Types.ObjectId.isValid(id);
}

export const db = {
  // --- PRODUCTS ---

  async getAllProducts(): Promise<Product[]> {
    if (!useMongo()) return mockProducts;

    await ensureDb();
    const docs = await ProductModel.find({ isActive: true })
      .sort({ createdAt: 1 })
      .lean();
    return docs.map((doc) => toProduct(doc));
  },

  async getProductBySlug(slug: string): Promise<Product | undefined> {
    if (!useMongo()) {
      return mockProducts.find((p) => p.slug === slug);
    }

    await ensureDb();
    const doc = await ProductModel.findOne({ slug, isActive: true }).lean();
    return doc ? toProduct(doc) : undefined;
  },

  async getProductById(id: string): Promise<Product | undefined> {
    if (!useMongo()) {
      return mockProducts.find((p) => p.id === id);
    }

    if (!isObjectId(id)) return undefined;

    await ensureDb();
    const doc = await ProductModel.findById(id).lean();
    if (!doc || doc.isActive === false) return undefined;
    return toProduct(doc);
  },

  async getProductsByCollectionId(collectionId: string): Promise<Product[]> {
    if (collectionId === "all") return this.getAllProducts();

    if (!useMongo()) {
      return mockProducts.filter((p) => p.collectionId === collectionId);
    }

    await ensureDb();
    const docs = await ProductModel.find({
      collectionId,
      isActive: true,
    })
      .sort({ createdAt: 1 })
      .lean();
    return docs.map((doc) => toProduct(doc));
  },

  // --- COLLECTIONS ---

  async getAllCollections(): Promise<Collection[]> {
    if (!useMongo()) return mockCollections;

    await ensureDb();
    const docs = await CollectionModel.find({ isActive: true })
      .sort({ createdAt: 1 })
      .lean();
    return docs.map((doc) => toCollection(doc));
  },

  async getCollectionBySlug(slug: string): Promise<Collection | undefined> {
    if (!useMongo()) {
      return mockCollections.find((c) => c.slug === slug);
    }

    await ensureDb();
    const doc = await CollectionModel.findOne({ slug, isActive: true }).lean();
    return doc ? toCollection(doc) : undefined;
  },

  async getCollectionById(id: string): Promise<Collection | undefined> {
    if (!useMongo()) {
      return mockCollections.find((c) => c.id === id);
    }

    if (!isObjectId(id)) return undefined;

    await ensureDb();
    const doc = await CollectionModel.findById(id).lean();
    if (!doc || doc.isActive === false) return undefined;
    return toCollection(doc);
  },
};
