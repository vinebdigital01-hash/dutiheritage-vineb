import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/services/db";
import { ProductClient } from "./ProductClient";

type Props = {
  params: Promise<{ slug: string }>;
};

// Next.js Dynamic Metadata API
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  
  // Uses the central db adapter for future migrations
  const product = await db.getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found | Duti Heritage",
    };
  }

  return {
    title: product.seoTitle || `${product.name} | Duti Heritage`,
    description: product.seoDescription || product.description || `Buy ${product.name} at Duti Heritage.`,
    openGraph: {
      title: product.seoTitle || product.name,
      description: product.seoDescription || product.description,
      images: [product.image],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  
  // Uses the central db adapter for future migrations
  const product = await db.getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <ProductClient product={product} />
  );
}
