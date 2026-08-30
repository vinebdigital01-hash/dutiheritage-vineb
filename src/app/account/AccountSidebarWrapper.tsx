import { SkeletonTable } from '@/components/ui/Skeleton';
"use client";
import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { FiHome, FiBox, FiMapPin, FiHeart, FiTag, FiUser, FiLogOut, FiClock } from "react-icons/fi";

export function AccountSidebarWrapper({ children }: { children: React.ReactNode }) {
  const { user, authLoading, logout } = useAppContext();
  const pathname = usePathname();

  if (authLoading) {
    return (
      <div className="w-full min-h-[70vh] flex items-center justify-center bg-[var(--color-bg)]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // If not logged in, just show the login page (children) without the sidebar
  if (!user) {
    return <>{children}</>;
  }

  const navItems = [
    { name: "Dashboard", href: "/account", icon: FiHome },
    { name: "My Orders", href: "/account/orders", icon: FiBox },
    { name: "My Addresses", href: "/account/addresses", icon: FiMapPin },
    { name: "Wishlist", href: "/account/wishlist", icon: FiHeart },
    { name: "My Coupons", href: "/account/coupons", icon: FiTag },
    { name: "Recently Viewed", href: "/account/recently-viewed", icon: FiClock },
    { name: "Profile Settings", href: "/account/profile", icon: FiUser },
  ];

  const getInitials = (name: string) => {
    return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
  };

  return (
    <div className="max-w-[1400px] mx-auto w-full flex flex-col md:flex-row min-h-[calc(100vh-80px)] bg-gray-50/30">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex w-[280px] lg:w-[320px] flex-col shrink-0 border-r border-[var(--color-border)] bg-white">
        <div className="p-8 border-b border-[var(--color-border)] flex flex-col items-center text-center">
          <div className="w-20 h-20 bg-gray-100 text-gray-700 rounded-full flex items-center justify-center text-2xl font-serif tracking-widest mb-4 border border-gray-200 shadow-sm">
            {getInitials(user.name)}
          </div>
          <h2 className="text-[16px] font-bold tracking-wide uppercase">{user.name}</h2>
          <p className="text-[13px] text-[var(--color-text-muted)] mt-1">{user.email}</p>
        </div>

        <nav className="flex-1 py-6 flex flex-col px-4 gap-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.name} 
                href={item.href}
                className={`flex items-center gap-4 px-4 py-3.5 text-[13px] font-medium tracking-[1px] uppercase transition-all rounded-lg ${
                  isActive 
                    ? "bg-black text-white shadow-md" 
                    : "text-gray-600 hover:bg-gray-100 hover:text-black"
                }`}
              >
                <item.icon className={`text-[18px] ${isActive ? "text-white" : "text-gray-500"}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-[var(--color-border)]">
          <button 
            onClick={logout}
            className="flex items-center gap-4 w-full px-4 py-3 text-[13px] font-medium tracking-[1px] uppercase text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <FiLogOut className="text-[18px]" />
            Log Out
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 w-full bg-transparent">
        {children}
      </main>
    </div>
  );
}

