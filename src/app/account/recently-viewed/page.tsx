"use client";
import React from "react";
import Link from "next/link";
import { FiClock, FiChevronLeft } from "react-icons/fi";
import { useAppContext } from "@/context/AppContext";
import { ProductCard } from "@/components/ProductCard/ProductCard";

export default function RecentlyViewedPage() {
  const { recentlyViewed } = useAppContext();

  return (
    <div className="w-full h-full p-4 md:p-8 lg:p-12 bg-white min-h-screen">
      <div className="flex items-center gap-4 mb-8 border-b border-[var(--color-border)] pb-6">
        <Link href="/account" className="md:hidden p-2 -ml-2 rounded-full hover:bg-gray-100">
          <FiChevronLeft className="text-xl" />
        </Link>
        <h1 className="text-2xl md:text-3xl font-serif tracking-[2px] uppercase">Recently Viewed</h1>
      </div>

      {recentlyViewed.length === 0 ? (
        <div className="py-16 flex flex-col items-center text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-200">
            <FiClock className="text-2xl text-purple-400" />
          </div>
          <h3 className="text-lg font-serif mb-2">No history yet</h3>
          <p className="text-[13px] text-gray-500 mb-6 max-w-sm">Products you browse will automatically appear here so you can easily find them again.</p>
          <Link href="/collections/all" className="px-8 py-3 bg-black text-white text-[12px] font-bold uppercase tracking-widest hover:bg-gray-800 rounded-lg transition-colors">
            Start Browsing
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {recentlyViewed.map((product, index) => (
            <ProductCard key={`${product.id}-${index}`} product={product} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}