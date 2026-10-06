import React, { Suspense } from "react";
import { notFound } from "next/navigation";
import { db } from "@/services/db";
import { Metadata } from "next";
import { getBaseUrl } from "@/lib/utils";
import { schemaAvailability } from "@/lib/cart-stock";
import { CollectionBrowseClient } from "./CollectionBrowseClient";

export const revalidate = 600;

export async function generateStaticParams() {
  const collections = await db.getAllCollections();
  return collections.map((collection) => ({
    slug: collection.slug,
  }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const baseUrl = getBaseUrl();
  let collectionName = "All Products";
  
  if (slug !== "all") {
    const collection = await db.getCollectionBySlug(slug);
    if (collection) {
      collectionName = collection.name;
    } else {
      return { title: "Collection Not Found | Duti Heritage" };
    }
  }

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

  let collection;
  let displayProducts;

  if (slug === "all") {
    displayProducts = await db.getAllProducts();
    collection = { id: "all", name: "All Products", slug: "all", productCount: displayProducts.length };
  } else {
    collection = await db.getCollectionBySlug(slug);
    if (!collection) {
      notFound();
    }
    displayProducts = await db.getProductsByCollectionId(collection.id);
  }

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
                "itemListElement": [
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
            ]
              },
              {
                "@type": "ItemList",
                "url": `${baseUrl}/collections/${collection.slug}`,
                "name": collection.name,
                "numberOfItems": displayProducts.length,
                "itemListElement": displayProducts.slice(0, 50).map((p, index) => ({
                  "@type": "ListItem",
                  "position": index + 1,
                  "item": {
                    "@type": "Product",
                    "name": p.name,
                    "url": `${baseUrl}/products/${p.slug}`,
                    "image": p.image ? (p.image.startsWith('http') ? p.image : `${baseUrl}${p.image}`) : undefined,
                    "offers": {
                      "@type": "Offer",
                      "priceCurrency": "INR",
                      "price": p.salePrice || p.price,
                      "itemCondition": "https://schema.org/NewCondition",
                      "availability": schemaAvailability(p),
                      "url": `${baseUrl}/products/${p.slug}`
                    }
                  }
                }))
              }
            ]
          }),
        }}
      />
      <Suspense fallback={<main className="min-h-screen bg-[var(--color-bg)]" />}>
        <CollectionBrowseClient title={collection.name} products={displayProducts} />
      </Suspense>
    </>
  );
}
