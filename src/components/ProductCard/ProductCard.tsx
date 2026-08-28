"use client";
import React from "react";
import Image from "next/image";
import Link from "next/link";
import { CldImage } from "next-cloudinary";
import { Product } from "@/types";

import { useAppContext } from "@/context/AppContext";
import { FiHeart } from "react-icons/fi";

interface ProductCardProps {
  product: Product;
  index?: number;
  priority?: boolean;
}

const isCloudinary = (src: string) => {
  if (!src) return false;
  if (src.includes("res.cloudinary.com")) return true;
  if (src.startsWith("/") || src.startsWith("http") || src.startsWith("blob:")) return false;
  return true;
};

export const ProductCard = ({ product, index = 0, priority = false }: ProductCardProps) => {
  const hasSale = product.salePrice && product.salePrice < product.price;
  const savings = hasSale ? product.price - product.salePrice! : 0;
  const { wishlist, toggleWishlist } = useAppContext();
  const isWishlisted = wishlist?.includes(product.id);

  return (
    <Link 
      href={`/products/${product.slug}`} 
      className="group flex flex-col h-full animate-fade-in-up opacity-0"
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className="relative w-full aspect-[3/4] overflow-hidden bg-[var(--color-surface)] mb-2">
        <button 
          onClick={(e) => { e.preventDefault(); toggleWishlist(product.id); }}
          className={`absolute top-3 right-3 z-10 p-2 rounded-full backdrop-blur-md transition-colors ${isWishlisted ? 'bg-black/80 text-white' : 'bg-white/80 text-black hover:bg-black hover:text-white'}`}
          aria-label="Wishlist"
        >
          <FiHeart className={isWishlisted ? "fill-current" : ""} size={16} />
        </button>
        {product.image ? (
          isCloudinary(product.image) ? (
            <CldImage 
              src={product.image}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-400 ease-in-out group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
              priority={priority}
            />
          ) : (
            <Image 
              src={product.image}
              alt={product.name}
              fill
              className="object-cover transition-transform duration-400 ease-in-out group-hover:scale-105"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 25vw, 20vw"
              priority={priority}
            />
          )
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 text-neutral-400 text-xs">
            No image
          </div>
        )}
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
