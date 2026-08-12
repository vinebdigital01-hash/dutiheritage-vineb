import React from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types";

interface ProductCardProps {
  product: Product;
  index?: number;
}

export const ProductCard = ({ product, index = 0 }: ProductCardProps) => {
  const hasSale = product.salePrice && product.salePrice < product.price;
  const savings = hasSale ? product.price - product.salePrice! : 0;

  return (
    <Link 
      href={`/products/${product.slug}`} 
      className="group flex flex-col h-full animate-fade-in-up opacity-0"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-[var(--color-surface)] mb-2">
        <Image 
          src={product.image}
          alt={product.name}
          fill
          className="object-cover transition-transform duration-400 ease-in-out group-hover:scale-105"
          sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
          priority={index < 4}
        />
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5 z-10">
          {product.tags && product.tags.map(tag => (
             <div key={tag} className="bg-[var(--color-accent)] text-white text-[10px] font-medium py-1 px-2 tracking-[1px] uppercase self-start shadow-sm">
               {tag}
             </div>
          ))}
          {!product.tags && product.badge && (
            <div className="bg-[var(--color-accent)] text-white text-[10px] font-medium py-1 px-2 tracking-[1px] uppercase self-start shadow-sm">
              {product.badge}
            </div>
          )}
          {hasSale && (
            <div className="bg-[var(--color-bg)] text-[var(--color-text)] text-[11px] font-medium py-1 px-2 tracking-[1px] uppercase self-start shadow-sm border border-gray-100">
              SALE
            </div>
          )}
        </div>
      </div>
      
      <div className="flex flex-col items-center text-center py-2">
        <h3 className="text-[13px] font-normal tracking-[2px] uppercase text-[var(--color-text)] mb-1.5">
          {product.name}
        </h3>
        
        <div className="flex items-center justify-center gap-2 text-[13px] mb-1">
          {hasSale ? (
            <>
              <span className="text-[var(--color-text-muted)] line-through">
                Rs. {product.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
              <span className="text-[var(--color-sale)]">
                Rs. {product.salePrice!.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </>
          ) : (
            <span className="text-[var(--color-text-muted)]">
              Rs. {product.price.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
            </span>
          )}
        </div>
        
        {hasSale && (
          <div className="text-[var(--color-save-badge)] text-[12px] font-medium mt-1">
            Save Rs. {savings.toLocaleString("en-IN")}
          </div>
        )}
      </div>
    </Link>
  );
};
