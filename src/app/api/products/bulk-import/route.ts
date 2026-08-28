import { NextResponse } from "next/server";
import { Product as ProductModel, Collection as CollectionModel } from "@/models";
import { requireAuth } from "@/lib/auth";
import { toProduct } from "@/lib/mappers";
import { connectDB } from "@/lib/mongodb";

export async function POST(req: Request) {
  try {
    await requireAuth(req, { admin: true });
    await connectDB();
    const { products } = await req.json();

    if (!Array.isArray(products) || products.length === 0) {
      return NextResponse.json({ error: "No products provided" }, { status: 400 });
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < products.length; i++) {
      const p = products[i];
      try {
        let collectionId = p.collectionId;
        
        if (!collectionId && p.collectionName) {
          const slug = p.collectionName.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");
          let col = await CollectionModel.findOne({ slug });
          if (!col) {
            col = await CollectionModel.create({
              name: p.collectionName.trim(),
              slug,
              isActive: true,
            });
          }
          collectionId = col._id.toString();
        }

        if (!collectionId) {
          throw new Error("Missing collectionName");
        }

        const newSlug = p.slug || p.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");

        const sizes = typeof p.sizes === 'string' ? p.sizes.split(',').map((s: string) => s.trim()).filter(Boolean) : (p.sizes || ["Free Size"]);
        const tags = typeof p.tags === 'string' ? p.tags.split(',').map((s: string) => s.trim()).filter(Boolean) : (p.tags || []);
        
        let imagesArray = p.images || [];
        if (typeof p.images === 'string') {
          imagesArray = p.images.split(',').map((url: string) => url.trim()).filter(Boolean);
        }

        const doc = await ProductModel.create({
          name: p.name,
          slug: newSlug,
          price: Number(p.price) || 0,
          salePrice: p.salePrice ? Number(p.salePrice) : null,
          description: p.description || "",
          collectionId,
          image: p.image || (imagesArray.length > 0 ? imagesArray[0] : ""),
          images: imagesArray,
          sizes,
          colors: p.colors ? [p.colors] : [],
          tags,
          seoTitle: p.seoTitle || p.name,
          seoDescription: p.seoDescription || "",
          boughtLast7Days: Number(p.boughtLast7Days) || 0,
          videoUrls: typeof p.videoUrls === 'string' ? p.videoUrls.split(',').map((s: string) => s.trim()).filter(Boolean) : (p.videoUrls || []),
          codAvailable: typeof p.codAvailable === 'boolean' ? p.codAvailable : (p.codAvailable === 'true' || p.codAvailable === 'yes'),
          isActive: typeof p.isActive === 'boolean' ? p.isActive : (p.isActive !== 'false' && p.isActive !== 'no'),
        });
        
        results.push(toProduct(doc.toObject() as any));
      } catch (err: any) {
        errors.push(`Row ${i + 1} (${p.name || 'Unknown'}): ${err.message}`);
      }
    }

    return NextResponse.json({ 
      success: true, 
      imported: results.length,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Failed to import products" },
      { status: 500 }
    );
  }
}
