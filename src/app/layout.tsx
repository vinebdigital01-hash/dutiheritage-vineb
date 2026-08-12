import type { Metadata } from "next";
import "./globals.css";

import { AppProvider } from "@/context/AppContext";
import { AnnouncementBar } from "@/components/AnnouncementBar/AnnouncementBar";
import { Header } from "@/components/Header/Header";
import { Footer } from "@/components/Footer/Footer";
import { CartDrawer } from "@/components/CartDrawer/CartDrawer";
import { SearchDrawer } from "@/components/SearchDrawer/SearchDrawer";

const getBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return 'http://localhost:3000';
};

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <AppProvider>
          <AnnouncementBar />
          <Header />
          <SearchDrawer />
          <CartDrawer />
          <main>{children}</main>
          <Footer />
        </AppProvider>
      </body>
    </html>
  );
}
