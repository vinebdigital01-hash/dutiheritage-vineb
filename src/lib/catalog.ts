import { connectDB } from "@/lib/mongodb";
import { Collection, Product } from "@/models";

export async function refreshCollectionProductCount(collectionId: string) {
  if (!collectionId) return;
  await connectDB();
  const count = await Product.countDocuments({
    collectionId,
    isActive: true,
  });
  await Collection.findByIdAndUpdate(collectionId, { productCount: count });
}
