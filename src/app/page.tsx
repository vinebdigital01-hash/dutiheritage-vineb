import { CollectionSection } from "@/components/CollectionSection/CollectionSection";
import { OfflineSync } from "@/components/OfflineSync/OfflineSync";
import { PromoBanner } from "@/components/PromoBanner/PromoBanner";
import { HomepageHero } from "@/components/HomepageHero/HomepageHero";
import {
  getSiteContent,
  resolveHomepageSlugs,
} from "@/lib/site-content-server";
import { resolveCollectionBrowse } from "@/lib/smart-collections";

export const revalidate = 60;

export default async function Home() {
  const siteContent = await getSiteContent();
  const slugs = resolveHomepageSlugs(siteContent);

  const collectionsData = await Promise.all(
    slugs.map(async (slug) => {
      const resolved = await resolveCollectionBrowse(slug);
      if (!resolved) return null;
      return {
        collection: resolved.collection,
        products: resolved.products,
        smart: resolved.smart,
      };
    })
  );

  const allProducts = collectionsData.flatMap((d) => (d ? d.products : []));

  return (
    <>
      <OfflineSync products={allProducts.slice(0, 50)} />
      <h1 className="sr-only">Duti Heritage - Premium Fashion & Luxury Apparel</h1>
      <HomepageHero banners={siteContent.heroBanners || []} />
      {collectionsData.map((data, index) => {
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
            key={data.collection.id || data.collection.slug}
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
