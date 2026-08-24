"use client";

import { usePathname } from "next/navigation";
import { AnnouncementBar } from "@/components/AnnouncementBar/AnnouncementBar";
import { Header } from "@/components/Header/Header";
import { Footer } from "@/components/Footer/Footer";
import { CartDrawer } from "@/components/CartDrawer/CartDrawer";
import { SearchDrawer } from "@/components/SearchDrawer/SearchDrawer";
import { AdminFloatingButton } from "@/components/admin/AdminFloatingButton";

export function StoreShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AnnouncementBar />
      <Header />
      <SearchDrawer />
      <CartDrawer />
      <main className="flex-grow">{children}</main>
      <Footer />
      <AdminFloatingButton />
    </div>
  );
}
