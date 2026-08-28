"use server";
import { connectDB } from "@/lib/mongodb";
import { Product as ProductModel } from "@/models";
import { toProduct } from "@/lib/mappers";
import { db } from "@/services/db";
import type { Product } from "@/types";

export async function searchProducts(query: string): Promise<Product[]> {
  if (!query || query.trim() === "") return [];
  await connectDB();
  
  // Use MongoDB native text search index
  const docs = await ProductModel.find({
    $text: { $search: query },
    isActive: true
  })
    .limit(12)
    .lean();
    
  return docs.map(toProduct as any);
}

export async function getTopCollections() {
  const collections = await db.getAllCollections();
  return collections.slice(0, 10);
}

/** Full catalog for client components (cart/checkout cross-sell). */
export async function getCatalogProducts(): Promise<Product[]> {
  return db.getAllProducts();
}
