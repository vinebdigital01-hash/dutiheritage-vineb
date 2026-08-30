import { SkeletonProductGrid } from '@/components/ui/Skeleton';
"use client";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { FiHeart, FiChevronLeft } from "react-icons/fi";
import { useAppContext } from "@/context/AppContext";
import { ProductCard } from "@/components/ProductCard/ProductCard";
import { Product } from "@/types";

export default function WishlistPage() {
  const { wishlist } = useAppContext();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (wishlist.length === 0) {
      setProducts([]);
      setLoading(false);
      return;
    }

    fetch("/api/products")
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          const allProducts: Product[] = data.products || [];
          const wishlistedProducts = allProducts.filter(p => wishlist.includes(p.id));
          setProducts(wishlistedProducts);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [wishlist]);

  return (
    <div className="w-full h-full p-4 md:p-8 lg:p-12 bg-white min-h-screen">
      <div className="flex items-center gap-4 mb-8 border-b border-[var(--color-border)] pb-6">
        <Link href="/account" className="md:hidden p-2 -ml-2 rounded-full hover:bg-gray-100">
          <FiChevronLeft className="text-xl" />
        </Link>
        <h1 className="text-2xl md:text-3xl font-serif tracking-[2px] uppercase">My Wishlist</h1>
        <span className="ml-2 bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[12px] font-bold">{wishlist.length}</span>
      </div>

      {loading ? (
        <div className="w-full py-12 flex flex-col items-center justify-center">
          <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin mb-4"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 flex flex-col items-center text-center bg-gray-50 rounded-2xl border border-dashed border-gray-300">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm border border-gray-200">
            <FiHeart className="text-2xl text-rose-400" />
          </div>
          <h3 className="text-lg font-serif mb-2">Your wishlist is empty</h3>
          <p className="text-[13px] text-gray-500 mb-6 max-w-sm">Save your favorite items here to buy them later.</p>
          <Link href="/collections/all" className="px-8 py-3 bg-black text-white text-[12px] font-bold uppercase tracking-widest hover:bg-gray-800 rounded-lg transition-colors">
            Discover Products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} index={index} />
          ))}
        </div>
      )}
    </div>
  );
}
