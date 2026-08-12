import type { Metadata } from "next";
import "./globals.css";

import { AppProvider } from "@/context/AppContext";
import { AnnouncementBar } from "@/components/AnnouncementBar/AnnouncementBar";
import { Header } from "@/components/Header/Header";
import { Footer } from "@/components/Footer/Footer";
import { CartDrawer } from "@/components/CartDrawer/CartDrawer";
import { SearchDrawer } from "@/components/SearchDrawer/SearchDrawer";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NODE_ENV === "production" 
      ? "https://duti-heritage.com" 
      : "http://localhost:3000"
  ),
  title: "Duti Heritage | Premium Fashion",
  description: "Shop the finest premium fashion and luxury apparel. Experience elegance with Duti Heritage.",
  keywords: ["fashion", "luxury", "apparel", "clothing", "premium", "dresses"],
  openGraph: {
    title: "Duti Heritage | Premium Fashion",
    description: "Shop the finest premium fashion and luxury apparel.",
    siteName: "Duti Heritage",
    images: [
      {
        url: "/og-image.jpg", // Placeholder for actual OG image
        width: 1200,
        height: 630,
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
