import { CollectionSection } from "@/components/CollectionSection/CollectionSection";
import { PromoBanner } from "@/components/PromoBanner/PromoBanner";
import { db } from "@/services/db";

export default async function Home() {
  // Fetch all collections in parallel for maximum performance
  // When this migrates to Firebase/MongoDB, Promise.all ensures we don't waterfall network requests
  const slugs = [
    "new-arrivals", "new-western-launch", "on-sale", "duti-heritage-luxe",
    "unstitched-sale", "premium-night-wear", "unstitched", "velvet",
    "wedding", "best-sellers", "dresses", "tops-shirts", "popular-picks"
  ];

  const collectionsData = await Promise.all(
    slugs.map(async (slug) => {
      const collection = await db.getCollectionBySlug(slug);
      if (!collection) return null;
      const products = await db.getProductsByCollectionId(collection.id);
      return { collection, products };
    })
  );

  return (
    <>
      {collectionsData.map((data) => {
        if (!data) return null;
        
        // Custom grid classes based on specific collections (retaining original logic)
        let gridClass: "grid-4" | "grid-5" = "grid-4";
        if (data.collection.slug === "unstitched-sale" || data.collection.slug === "premium-night-wear") {
          gridClass = "grid-5";
        }

        return (
          <CollectionSection 
            key={data.collection.id} 
            collection={data.collection} 
            products={data.products} 
            gridClass={gridClass} 
          />
        );
      })}
      
      <PromoBanner />
    </>
  );
}
