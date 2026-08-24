import type { Metadata } from "next";
import { Suspense } from "react";
import { Outfit } from "next/font/google";
import "./globals.css";

import { AppProvider } from "@/context/AppContext";
import { FacebookPixel } from "@/components/FacebookPixel/FacebookPixel";
import { StoreShell } from "@/components/StoreShell";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  display: "swap",
  variable: "--font-outfit",
});

import { getBaseUrl } from "@/lib/utils";

export const metadata: Metadata = {
  metadataBase: new URL(getBaseUrl()),
  title: "Duti Heritage | Premium Fashion",
  description: "Shop the finest premium fashion and luxury apparel. Experience elegance with Duti Heritage.",
  keywords: ["fashion", "luxury", "apparel", "clothing", "premium", "dresses"],
  openGraph: {
    title: "Duti Heritage | Premium Fashion",
    description: "Shop the finest premium fashion and luxury apparel.",
    siteName: "Duti Heritage",
    images: [
      {
        url: "/images/velvet.jpg", // Default OG image for the homepage
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
    title: "Duti Heritage | Premium Fashion",
    description: "Shop the finest premium fashion and luxury apparel.",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
};

export const viewport = {
  themeColor: "#000000",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const baseUrl = getBaseUrl();

  // Organization JSON-LD (shows brand info in Google Knowledge Panel)
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
      <body>
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
          <StoreShell>{children}</StoreShell>
        </AppProvider>
      </body>
    </html>
  );
}
