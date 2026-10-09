"use server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { Product as ProductModel } from "@/models";
import { toProduct } from "@/lib/mappers";
import { db } from "@/services/db";
import type { Product } from "@/types";

export async function searchProducts(query: string, limit = 12): Promise<Product[]> {
  const q = query.trim();
  if (!q) return [];
  await connectDB();
  const cap = Math.min(48, Math.max(1, limit));
  try {
    const docs = await ProductModel.find({
      $text: { $search: q },
      isActive: true,
    })
      .limit(cap)
      .lean();
    if (docs.length) return docs.map(toProduct as any);
  } catch {
    /* no text index — fall through */
  }
  const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
  const docs = await ProductModel.find({
    isActive: true,
    $or: [{ name: rx }, { slug: rx }, { tags: rx }],
  })
    .limit(cap)
    .lean();
  return docs.map(toProduct as any);
}

export async function getTopCollections() {
  const collections = await db.getAllCollections();
  return collections.slice(0, 10);
}

function asObjectIds(ids: string[]) {
  return [...new Set(ids)].filter((id) => mongoose.Types.ObjectId.isValid(id));
}

/** Small related/wishlist set for cart and checkout. Do not send the full catalog to the browser. */
export async function getCrossSellProducts(input: {
  excludeIds: string[];
  collectionIds: string[];
  wishlistIds: string[];
  limit?: number;
}): Promise<{ title: string; products: Product[] }> {
  const limit = Math.min(6, Math.max(3, input.limit ?? 4));
  await connectDB();

  const exclude = asObjectIds(input.excludeIds);
  const wish = asObjectIds(input.wishlistIds).filter((id) => !exclude.includes(id)).slice(0, 8);

  if (wish.length) {
    const wishDocs = await ProductModel.find({
      isActive: true,
      _id: { $in: wish.map((id) => new mongoose.Types.ObjectId(id)) },
    } as Record<string, unknown>)
      .limit(limit)
      .lean();
    if (wishDocs.length) {
      return { title: "From Your Wishlist", products: wishDocs.map(toProduct as any) };
    }
  }

  const collectionIds = input.collectionIds.filter(Boolean).slice(0, 12);
  const related =
    collectionIds.length > 0
      ? await ProductModel.find({
          isActive: true,
          collectionId: { $in: collectionIds },
          ...(exclude.length
            ? { _id: { $nin: exclude.map((id) => new mongoose.Types.ObjectId(id)) } }
            : {}),
        } as Record<string, unknown>)
          .limit(limit)
          .lean()
      : [];

  let products = related.map(toProduct as any) as Product[];
  if (products.length < limit) {
    const extraExclude = [...exclude, ...products.map((p) => p.id)].filter((id) =>
      mongoose.Types.ObjectId.isValid(id)
    );
    const extra = await ProductModel.find({
      isActive: true,
      tags: "Bestseller",
      ...(extraExclude.length
        ? { _id: { $nin: extraExclude.map((id) => new mongoose.Types.ObjectId(id)) } }
        : {}),
    } as Record<string, unknown>)
      .limit(limit - products.length)
      .lean();
    products = [...products, ...(extra.map(toProduct as any) as Product[])];
  }

  return {
    title: products.length ? "People Also Bought" : "Recommended",
    products: products.slice(0, limit),
  };
}

