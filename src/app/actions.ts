"use server";
import { db } from "@/services/db";
import type { Product } from "@/types";

export async function searchProducts(query: string) {
  if (!query || query.trim() === "") return [];
  const products = await db.getAllProducts();
  const q = query.toLowerCase();
  return products.filter(
    (p) => p.name.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q)
  ).slice(0, 12);
}

export async function getTopCollections() {
  const collections = await db.getAllCollections();
  return collections.slice(0, 10);
}

/** Full catalog for client components (cart/checkout cross-sell). */
export async function getCatalogProducts(): Promise<Product[]> {
  return db.getAllProducts();
}
