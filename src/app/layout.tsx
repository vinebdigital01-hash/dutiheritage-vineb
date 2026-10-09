import type { Metadata } from "next";
import { Suspense } from "react";
import { Outfit } from "next/font/google";
import "./globals.css";

import { AppProvider } from "@/context/AppContext";
import { FacebookPixel } from "@/components/FacebookPixel/FacebookPixel";
import { StoreShell } from "@/components/StoreShell";
import { SiteContentProvider } from "@/context/SiteContentContext";
import { getSiteContent } from "@/lib/site-content-server";
import { ToastProvider } from "@/components/ToastProvider";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-outfit",
});

import { getBaseUrl } from "@/lib/utils";
import { getStoreSettings } from "@/lib/store-settings";
import type { SiteContentData } from "@/lib/site-content-shared";

const FALLBACK_TITLE = "Duti Heritage | Premium Fashion";
const FALLBACK_DESC =
  "Shop the finest premium ethnic wear, pure cotton suits, and luxury nightwear in Delhi NCR, Gurugram, and Manesar. Experience elegance with Duti Heritage.";

function enrichSiteContent(
  content: SiteContentData,
  store: Awaited<ReturnType<typeof getStoreSettings>>
): SiteContentData {
  const year = new Date().getFullYear();
  const company =
    content.footer?.companyName?.trim() || store.legalName || "Duti Heritage";
  return {
    ...content,
    footer: {
      ...content.footer,
      companyName: company,
      phone: content.footer?.phone?.trim() || store.supportPhone || "",
      email: content.footer?.email?.trim() || store.supportEmail || "",
      address: content.footer?.address?.trim() || store.address || "",
      gstin: content.footer?.gstin?.trim() || store.gstin || "",
      copyright:
        content.footer?.copyright?.trim() || `© ${year} ${company}`,
      instagramUrl: content.footer?.instagramUrl?.trim() || "",
      facebookUrl: content.footer?.facebookUrl?.trim() || "",
      pinterestUrl: content.footer?.pinterestUrl?.trim() || "",
      whatsappUrl: content.footer?.whatsappUrl?.trim() || "",
    },
  };
}

function sameAsFromContent(content: SiteContentData): string[] {
  const urls = [
    content.footer?.instagramUrl,
    content.footer?.facebookUrl,
    content.footer?.pinterestUrl,
    content.footer?.whatsappUrl,
  ]
    .map((u) => String(u || "").trim())
    .filter((u) => u.startsWith("http"));
  return [...new Set(urls)];
}

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
  const rawContent = await getSiteContent();
  let store;
  try {
    store = await getStoreSettings();
  } catch {
    store = null;
  }
  const siteContent = store ? enrichSiteContent(rawContent, store) : rawContent;
  const baseUrl = getBaseUrl();
  const phone =
    siteContent.footer?.phone?.replace(/\D/g, "") ||
    store?.supportPhone?.replace(/\D/g, "") ||
    "";
  const tel = phone
    ? phone.length === 10
      ? `+91${phone}`
      : phone.startsWith("91")
        ? `+${phone}`
        : `+${phone}`
    : undefined;

  // Organization JSON-LD (shows brand info in Google Knowledge Panel)
  
  // LocalBusiness JSON-LD (For Local SEO in Delhi NCR / Gurugram)
  const localBusinessJsonLd = {
    "@context": "https://schema.org",
    "@type": "ClothingStore",
    "name": siteContent.footer?.companyName || "Duti Heritage",
    "image": `${baseUrl}/images/velvet.jpg`,
    "@id": baseUrl,
    "url": baseUrl,
    ...(tel ? { telephone: tel } : {}),
    "address": {
      "@type": "PostalAddress",
      "streetAddress": siteContent.footer?.address || store?.address || "103, Block D, DLF Express Green M1, IMT",
      "addressLocality": "Manesar, Gurugram",
      "addressRegion": store?.state || "Haryana",
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
    name: siteContent.footer?.companyName || "Duti Heritage",
    url: baseUrl,
    logo: `${baseUrl}/images/velvet.jpg`,
    sameAs: sameAsFromContent(siteContent),
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
          <ToastProvider>
            <SiteContentProvider content={siteContent}>
              <StoreShell>{children}</StoreShell>
            </SiteContentProvider>
          </ToastProvider>
        </AppProvider>
      </body>
    </html>
  );
}
