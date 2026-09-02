import { CollectionSection } from "@/components/CollectionSection/CollectionSection";
import { PromoBanner } from "@/components/PromoBanner/PromoBanner";
import { db } from "@/services/db";
import {
  getSiteContent,
  resolveHomepageSlugs,
} from "@/lib/site-content-server";

export const revalidate = 3600;

export default async function Home() {
  const siteContent = await getSiteContent();
  const orderedSlugs = resolveHomepageSlugs(siteContent);

  const allCollections = await db.getAllCollections();

  const orderedCollections = [];
  const handledIds = new Set<string>();

  // 1. Prioritize collections specified in Admin (or defaults), in that exact order
  for (const slug of orderedSlugs) {
    const col = allCollections.find(c => c.slug === slug);
    if (col && !handledIds.has(col.id)) {
      orderedCollections.push(col);
      handledIds.add(col.id);
    }
  }

  // 2. Auto-append any remaining active collections that are not in the list
  for (const col of allCollections) {
    if (!handledIds.has(col.id)) {
      orderedCollections.push(col);
      handledIds.add(col.id);
    }
  }

  // 3. Fetch products for all these collections
  const collectionsData = await Promise.all(
    orderedCollections.map(async (collection) => {
      const products = await db.getProductsByCollectionId(collection.id);
      return { collection, products };
    })
  );

  return (
    <>
      <h1 className="sr-only">Duti Heritage - Premium Fashion & Luxury Apparel</h1>
      {collectionsData.map((data, index) => {
        // Skip collections that have no active products to keep the homepage clean
        if (!data || data.products.length === 0) return null;

        let gridClass: "grid-4" | "grid-5" = "grid-4";
        if (
          data.collection.slug === "unstitched-sale" ||
          data.collection.slug === "premium-night-wear"
        ) {
          gridClass = "grid-5";
        }

        return (
          <CollectionSection
            key={data.collection.id}
            collection={data.collection}
            products={data.products}
            gridClass={gridClass}
            priority={index === 0}
          />
        );
      })}

      <PromoBanner />
    </>
  );
}
