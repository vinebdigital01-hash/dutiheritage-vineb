import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/services/db";
import { Metadata } from "next";
import { getBaseUrl } from "@/lib/utils";
import { schemaAvailability } from "@/lib/cart-stock";
import {
  isSmartCollectionSlug,
  resolveCollectionBrowse,
  SMART_COLLECTION_SLUGS,
} from "@/lib/smart-collections";
import { CollectionBrowseClient } from "./CollectionBrowseClient";

export const revalidate = 60;

export async function generateStaticParams() {
  const collections = await db.getAllCollections();
  const slugs = new Set([
    ...collections.map((c) => c.slug),
    ...SMART_COLLECTION_SLUGS,
    "all",
  ]);
  return [...slugs].map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = getBaseUrl();
  const resolved = await resolveCollectionBrowse(slug);

  if (!resolved) {
    return { title: "Collection Not Found | Duti Heritage" };
  }

  const collectionName = resolved.collection.name;

  return {
    title: `${collectionName} | Duti Heritage`,
    description: `Shop the latest ${collectionName} at Duti Heritage. Premium fashion and quality apparel.`,
    alternates: {
      canonical: `${baseUrl}/collections/${slug}`,
    },
    openGraph: {
      title: `${collectionName} | Duti Heritage`,
      description: `Shop the latest ${collectionName} at Duti Heritage.`,
      url: `${baseUrl}/collections/${slug}`,
    },
  };
}

export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resolved = await resolveCollectionBrowse(slug);
  if (!resolved) {
    notFound();
  }

  const { collection, products: displayProducts } = resolved;
  const baseUrl = getBaseUrl();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "BreadcrumbList",
                itemListElement: [
                  {
                    "@type": "ListItem",
                    position: 1,
                    name: "Home",
                    item: baseUrl,
                  },
                  {
                    "@type": "ListItem",
                    position: 2,
                    name: collection.name,
                    item: `${baseUrl}/collections/${collection.slug}`,
                  },
                ],
              },
              {
                "@type": "ItemList",
                url: `${baseUrl}/collections/${collection.slug}`,
                name: collection.name,
                numberOfItems: displayProducts.length,
                itemListElement: displayProducts.slice(0, 50).map((p, index) => ({
                  "@type": "ListItem",
                  position: index + 1,
                  item: {
                    "@type": "Product",
                    name: p.name,
                    url: `${baseUrl}/products/${p.slug}`,
                    image: p.image
                      ? p.image.startsWith("http")
                        ? p.image
                        : `${baseUrl}${p.image}`
                      : undefined,
                    offers: {
                      "@type": "Offer",
                      priceCurrency: "INR",
                      price: p.salePrice || p.price,
                      itemCondition: "https://schema.org/NewCondition",
                      availability: schemaAvailability(p),
                      url: `${baseUrl}/products/${p.slug}`,
                    },
                  },
                })),
              },
            ],
          }),
        }}
      />
      <Suspense fallback={<main className="min-h-screen bg-[var(--color-bg)]" />}>
        <CollectionBrowseClient
          title={collection.name}
          products={displayProducts}
          emptyHint={
            isSmartCollectionSlug(slug)
              ? slug === "on-sale"
                ? "No sale prices yet. Mark a sale price on products, or add a Sale tag."
                : "No ranked products yet. Sales, views tags, or bought counts will fill this list."
              : undefined
          }
        />
      </Suspense>
    </>
  );
}
