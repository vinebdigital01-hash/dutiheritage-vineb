import Link from "next/link";
import { FiArrowRight } from "react-icons/fi";
import { db } from "@/services/db";
import { ProductCard } from "@/components/ProductCard/ProductCard";

import { Product } from "@/types";

export const revalidate = 300;

export default async function NotFound() {
  let recommended: Product[] = [];
  try {
    const products = await db.getAllProducts();
    // Get 4 random products
    const shuffled = [...products].sort(() => 0.5 - Math.random());
    recommended = shuffled.slice(0, 4);
  } catch (error) {
    console.error("Failed to fetch recommended products for 404 page", error);
  }

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-start px-4 py-16 bg-[var(--color-bg)]">
      <div className="text-center max-w-lg mx-auto mb-16">
        <h1 className="text-8xl md:text-9xl font-serif tracking-widest text-gray-200 mb-6">404</h1>
        
        <h2 className="text-2xl md:text-3xl font-serif tracking-[2px] uppercase mb-4 text-[var(--color-text)]">
          Page Not Found
        </h2>
        
        <p className="text-[14px] text-gray-500 leading-relaxed mb-10 max-w-md mx-auto">
          The product or page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link 
            href="/collections/all" 
            className="w-full sm:w-auto px-8 py-3.5 bg-black text-white text-[12px] font-bold tracking-[2px] uppercase hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
          >
            Continue Shopping
            <FiArrowRight />
          </Link>
          
          <Link 
            href="/" 
            className="w-full sm:w-auto px-8 py-3.5 border border-black text-black text-[12px] font-bold tracking-[2px] uppercase hover:bg-gray-50 transition-colors"
          >
            Go to Home
          </Link>
        </div>
      </div>

      {recommended.length > 0 && (
        <div className="w-full max-w-[1440px] mx-auto lg:px-8 mt-8 border-t border-[var(--color-border)] pt-16">
          <h3 className="text-xl md:text-2xl font-serif tracking-[2px] uppercase mb-10 text-center">
            You might also like
          </h3>
          <div className="flex overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-4 gap-4 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {recommended.map((product, index) => (
              <div key={product.id} className="min-w-[70vw] sm:min-w-[40vw] md:min-w-0 snap-start">
                <ProductCard product={product} index={index} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
