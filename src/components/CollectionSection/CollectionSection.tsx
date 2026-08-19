import React from "react";
import Link from "next/link";
import { Product, Collection } from "@/types";
import { ProductCard } from "../ProductCard/ProductCard";

interface CollectionSectionProps {
  collection: Collection;
  products: Product[];
  gridClass?: "grid-4" | "grid-5";
  priority?: boolean;
}

export const CollectionSection = ({ collection, products, gridClass = "grid-4", priority = false }: CollectionSectionProps) => {
  if (!products.length) return null;

  // Map grid-4 to Tailwind grid classes for desktop and tablet, but flex for horizontal scroll on mobile
  const gridTailwindClass = gridClass === "grid-4" 
    ? "flex overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]" 
    : "flex overflow-x-auto snap-x snap-mandatory md:grid md:grid-cols-3 lg:grid-cols-5 gap-4 pb-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]";

  return (
    <section className="w-full py-4 md:py-8">
      <div className="w-full max-w-[1440px] mx-auto px-4 lg:px-8">
        <div className="flex flex-col items-center justify-center mb-6 md:mb-8 gap-4">
          <h2 className="text-2xl md:text-[28px] font-normal tracking-[2px] uppercase m-0 font-serif text-center">
            {collection.name}
          </h2>
          <Link 
            href={`/collections/${collection.slug}`} 
            className="text-[11px] tracking-[2px] uppercase border border-[var(--color-border)] py-2 px-6 transition-all duration-200 hover:bg-[var(--color-text)] hover:text-[var(--color-bg)]"
          >
            VIEW ALL
          </Link>
        </div>

        <div className={gridTailwindClass}>
          {products.map((product, index) => (
            <div key={product.id} className="min-w-[45vw] sm:min-w-[30vw] md:min-w-0 snap-start">
              <ProductCard product={product} index={index} priority={priority && index < 4} />
            </div>
          ))}
          
          {/* Mobile "View All" card at the end of horizontal scroll */}
          <div className="min-w-[45vw] sm:min-w-[30vw] md:hidden snap-start flex items-center justify-center">
            <Link 
              href={`/collections/${collection.slug}`} 
              className="w-full aspect-[3/4] flex flex-col items-center justify-center border border-[var(--color-border)] p-4 text-center hover:border-black transition-colors"
            >
              <span className="text-[13px] tracking-[1px]">View all <br/>{collection.productCount || products.length} products</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
