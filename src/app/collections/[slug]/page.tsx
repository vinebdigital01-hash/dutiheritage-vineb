import React from "react";
import { notFound } from "next/navigation";
import { db } from "@/services/db";
import Link from "next/link";
import Image from "next/image";
import { Metadata } from "next";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
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
    openGraph: {
      title: `${collectionName} | Duti Heritage`,
      description: `Shop the latest ${collectionName} at Duti Heritage.`,
    },
  };
}
// This is an async Server Component.
// When you build the admin panel and connect the database later, 
// you can easily replace the mock data with Prisma calls right here!
// e.g., const collection = await prisma.collection.findUnique({ where: { slug } });
export default async function CollectionPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  // 1. Fetch Collection & Products
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

  return (
    <main className="w-full min-h-screen bg-[var(--color-bg)]">
      {/* Header Area */}
      <div className="py-12 md:py-16 text-center px-4">
        <h1 className="text-2xl md:text-3xl font-serif tracking-[3px] uppercase">
          {collection.name}
        </h1>
        <p className="text-[13px] text-[var(--color-text-muted)] mt-4">
          {displayProducts.length} Products
        </p>
      </div>

      {/* Products Grid */}
      <div className="max-w-[1440px] mx-auto px-4 pb-24">
        {displayProducts.length === 0 ? (
          <div className="text-center text-[var(--color-text-muted)] py-12">
            No products found in this collection.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 gap-y-10">
            {displayProducts.map((product) => (
              <Link 
                href={`/products/${product.slug}`} 
                key={product.id} 
                className="group flex flex-col"
              >
                <div className="relative w-full aspect-[3/4] bg-gray-50 mb-4 overflow-hidden">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
                  />
                  {product.salePrice && (
                    <div className="absolute top-2 left-2 bg-[var(--color-sale)] text-white text-[10px] tracking-[1px] uppercase px-2 py-1">
                      Sale
                    </div>
                  )}
                </div>
                
                <h3 className="text-[13px] tracking-[1px] uppercase mb-1 truncate">
                  {product.name}
                </h3>
                
                <div className="flex items-center gap-2 text-[13px]">
                  {product.salePrice ? (
                    <>
                      <span className="text-[var(--color-sale)]">
                        Rs. {product.salePrice.toLocaleString("en-IN")}
                      </span>
                      <span className="text-[var(--color-text-muted)] line-through">
                        Rs. {product.price.toLocaleString("en-IN")}
                      </span>
                    </>
                  ) : (
                    <span>Rs. {product.price.toLocaleString("en-IN")}</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
