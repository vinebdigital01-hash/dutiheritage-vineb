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
  const baseUrl = getBaseUrl();

  if (!product) {
    return {
      title: "Product Not Found | Duti Heritage",
    };
  }

  const fallbackDesc = `Discover the exquisite ${product.name} at Duti Heritage. Shop our premium collection of luxury fashion, handcrafted for unmatched elegance, style, and comfort.`;
  const absoluteImageUrl = product.image.startsWith('http') ? product.image : `${baseUrl}${product.image}`;

  return {
    title: product.seoTitle || `${product.name} | Duti Heritage`,
    description: product.seoDescription || product.description || fallbackDesc,
    alternates: {
      canonical: `${baseUrl}/products/${slug}`,
    },
    openGraph: {
      title: product.seoTitle || product.name,
      description: product.seoDescription || product.description || fallbackDesc,
      siteName: "Duti Heritage",
      url: `${baseUrl}/products/${slug}`,
      images: [
        {
          url: absoluteImageUrl,
          width: 1200,
          height: 630,
          alt: product.name
        }
      ],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.seoTitle || product.name,
      description: product.seoDescription || product.description || fallbackDesc,
      images: [absoluteImageUrl],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const baseUrl = getBaseUrl();
  
  // Uses the central db adapter for future migrations
  const product = await db.getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Fetch collection name for breadcrumbs
  const collection = await db.getCollectionBySlug(
    (await db.getAllCollections()).find(c => c.id === product.collectionId)?.slug || ""
  );

  const absoluteImageUrl = product.image.startsWith('http') ? product.image : `${baseUrl}${product.image}`;

  // JSON-LD Product Schema for Rich Snippets
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.seoDescription || product.description || `Premium ${product.name} from Duti Heritage.`,
    image: absoluteImageUrl,
    brand: {
      "@type": "Brand",
      name: "Duti Heritage",
    },
    offers: {
      "@type": "Offer",
      url: `${baseUrl}/products/${product.slug}`,
      priceCurrency: "INR",
      price: product.salePrice || product.price,
      ...(product.salePrice && { priceValidUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] }),
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
    ...(product.tags && product.tags.length > 0 && { keywords: product.tags.join(", ") }),
  };

  // JSON-LD BreadcrumbList
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: baseUrl,
      },
      ...(collection ? [{
        "@type": "ListItem",
        position: 2,
        name: collection.name,
        item: `${baseUrl}/collections/${collection.slug}`,
      }] : []),
      {
        "@type": "ListItem",
        position: collection ? 3 : 2,
        name: product.name,
        item: `${baseUrl}/products/${product.slug}`,
      },
    ],
  };

  // Fetch suggested products on the server (avoids bundling all products into client JS)
  const allProducts = await db.getAllProducts();
  const suggestedProducts = allProducts
    .filter(p => p.id !== product.id)
    .slice(0, 5);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ProductClient product={product} suggestedProducts={suggestedProducts} />
    </>
  );
}
