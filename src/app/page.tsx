import { CollectionSection } from "@/components/CollectionSection/CollectionSection";
import { PromoBanner } from "@/components/PromoBanner/PromoBanner";
import { db } from "@/services/db";
import {
  getSiteContent,
  resolveHomepageSlugs,
} from "@/lib/site-content-server";

export default async function Home() {
  const siteContent = await getSiteContent();
  const slugs = resolveHomepageSlugs(siteContent);

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
      <h1 className="sr-only">Duti Heritage — Premium Fashion & Luxury Apparel</h1>
      {collectionsData.map((data, index) => {
        if (!data) return null;

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
