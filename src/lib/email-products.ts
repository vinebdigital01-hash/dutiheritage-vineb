import { Product } from "@/models/Product";
import { connectDB } from "@/lib/mongodb";
import { EmailProductType } from "./email";

export async function getLatestProducts(limit = 4): Promise<EmailProductType[]> {
  try {
    await connectDB();
    const products = await Product.find({ isActive: true })
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return products.map((p: any) => ({
      name: p.name,
      slug: p.slug,
      image: p.image || p.images?.[0],
      price: p.price,
      salePrice: p.salePrice,
    }));
  } catch (err) {
    console.error("Failed to get latest products:", err);
    return [];
  }
}

export async function getRelatedProducts(
  collectionId: string,
  excludeIds: string[] = [],
  limit = 4
): Promise<EmailProductType[]> {
  try {
    await connectDB();
    const query: any = { isActive: true };
    
    if (collectionId) {
      query.collectionId = collectionId;
    }
    
    if (excludeIds && excludeIds.length > 0) {
      query._id = { $nin: excludeIds };
    }

    const products = await Product.find(query)
      .sort({ createdAt: -1 }) // Sort by newest in that collection
      .limit(limit)
      .lean();

    // If we couldn't find enough related products, backfill with latest products
    if (products.length < limit) {
      const remainingLimit = limit - products.length;
      const foundIds = products.map((p: any) => p._id.toString());
      const allExcludeIds = [...excludeIds, ...foundIds];
      
      const backfillProducts = await Product.find({
        isActive: true,
        _id: { $nin: allExcludeIds }
      })
      .sort({ createdAt: -1 })
      .limit(remainingLimit)
      .lean();
      
      products.push(...backfillProducts);
    }

    return products.map((p: any) => ({
      name: p.name,
      slug: p.slug,
      image: p.image || p.images?.[0],
      price: p.price,
      salePrice: p.salePrice,
    }));
  } catch (err) {
    console.error("Failed to get related products:", err);
    return [];
  }
}
