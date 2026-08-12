import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/services/db";
import { ProductClient } from "./ProductClient";

type Props = {
  params: Promise<{ slug: string }>;
};

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
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

  const fallbackDesc = `Discover the exquisite ${product.name} at Duti Heritage. Shop our premium collection of luxury fashion, handcrafted for unmatched elegance, style, and comfort.`;
  const absoluteImageUrl = product.image.startsWith('http') ? product.image : `${getBaseUrl()}${product.image}`;

  return {
    title: product.seoTitle || `${product.name} | Duti Heritage`,
    description: product.seoDescription || product.description || fallbackDesc,
    openGraph: {
      title: product.seoTitle || product.name,
      description: product.seoDescription || product.description || fallbackDesc,
      siteName: "Duti Heritage",
      images: [
        {
          url: absoluteImageUrl,
          width: 1200,
          height: 630,
          alt: product.name
        }
      ],
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
