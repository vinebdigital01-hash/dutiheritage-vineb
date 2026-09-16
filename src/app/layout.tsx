import type { Metadata } from "next";
import { Suspense } from "react";
import { Outfit } from "next/font/google";
import "./globals.css";

import { AppProvider } from "@/context/AppContext";
import { FacebookPixel } from "@/components/FacebookPixel/FacebookPixel";
import { StoreShell } from "@/components/StoreShell";
import { SiteContentProvider } from "@/context/SiteContentContext";
import { getSiteContent } from "@/lib/site-content-server";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-outfit",
});

import { getBaseUrl } from "@/lib/utils";
import { getStoreSettings } from "@/lib/store-settings";

const FALLBACK_TITLE = "Duti Heritage | Premium Fashion";
const FALLBACK_DESC =
  "Shop the finest premium ethnic wear, pure cotton suits, and luxury nightwear in Delhi NCR, Gurugram, and Manesar. Experience elegance with Duti Heritage.";

export async function generateMetadata(): Promise<Metadata> {
  let title = FALLBACK_TITLE;
  let description = FALLBACK_DESC;
  try {
    const store = await getStoreSettings();
    if (store.seoTitle) title = store.seoTitle;
    if (store.seoDescription) description = store.seoDescription;
  } catch {
    /* keep fallbacks */
  }

  return {
    metadataBase: new URL(getBaseUrl()),
    title,
    description,
    keywords: ["ethnic wear Delhi NCR", "premium fashion Gurugram", "cotton suits Manesar", "luxury nightwear Gurgaon", "boutique Delhi", "Duti Heritage", "women clothing Gurgaon"],
    openGraph: {
      title,
      description,
      siteName: "Duti Heritage",
      images: [
        {
          url: "/images/velvet.jpg",
          width: 1200,
          height: 630,
          alt: "Duti Heritage Premium Fashion"
        }
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
    manifest: "/manifest.json",
  };
}

export const viewport = {
  themeColor: "#000000",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const siteContent = await getSiteContent();
  const baseUrl = getBaseUrl();

  // Organization JSON-LD (shows brand info in Google Knowledge Panel)
  
  // LocalBusiness JSON-LD (For Local SEO in Delhi NCR / Gurugram)
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    "name": "Duti Heritage",
    "image": `${baseUrl}/images/velvet.jpg`,
    "@id": baseUrl,
    "url": baseUrl,
    "telephone": "+917017194982",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "103, Block D, DLF Express Green M1, IMT",
      "addressLocality": "Manesar, Gurugram",
      "addressRegion": "Haryana",
      "postalCode": "122052",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 28.3564, 
      "longitude": 76.9388
    },
    "areaServed": [
      { "@type": "City", "name": "Gurugram" },
      { "@type": "City", "name": "Manesar" },
      { "@type": "City", "name": "Delhi" },
      { "@type": "City", "name": "Noida" },
      { "@type": "State", "name": "Delhi NCR" }
    ],
    "priceRange": "$$"
  };

  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Duti Heritage",
    url: baseUrl,
    logo: `${baseUrl}/images/velvet.jpg`,
    sameAs: [
      // Add your social media URLs here when available
      // "https://www.instagram.com/dutiheritage",
      // "https://www.facebook.com/dutiheritage",
    ],
  };

  // WebSite JSON-LD (enables sitelinks searchbox in Google)
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Duti Heritage",
    url: baseUrl,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${baseUrl}/collections/all?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en" className={outfit.variable}>
      <head>
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
      </head>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />
        <Suspense fallback={null}>
          <FacebookPixel />
        </Suspense>
        <AppProvider>
          <SiteContentProvider content={siteContent}>
            <StoreShell>{children}</StoreShell>
          </SiteContentProvider>
        </AppProvider>
      </body>
    </html>
  );
}
