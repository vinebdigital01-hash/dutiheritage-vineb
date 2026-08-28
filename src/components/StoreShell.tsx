"use client";

import { usePathname } from "next/navigation";
import dynamic from 'next/dynamic';
import { AnnouncementBar } from "@/components/AnnouncementBar/AnnouncementBar";
import { Header } from "@/components/Header/Header";
import { Footer } from "@/components/Footer/Footer";
import { AdminFloatingButton } from "@/components/admin/AdminFloatingButton";

const CartDrawer = dynamic(() => import('@/components/CartDrawer/CartDrawer').then(m => ({ default: m.CartDrawer })), { ssr: false });
const SearchDrawer = dynamic(() => import('@/components/SearchDrawer/SearchDrawer').then(m => ({ default: m.SearchDrawer })), { ssr: false });

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
