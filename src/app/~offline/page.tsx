"use client";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Product } from "@/types";
import { useAppContext } from "@/context/AppContext";

export default function OfflinePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const { addToCart } = useAppContext();
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load the catalog we synced while they were online
    const saved = localStorage.getItem("duti-heritage_offline_catalog");
    if (saved) {
      try {
        setProducts(JSON.parse(saved));
      } catch (_) {
        console.error("Failed to parse offline catalog");
      }
    }
  }, []);

  const handleAddToCart = (product: Product) => {
    // Quick Add defaults to size "M" for offline purchases
    addToCart(product, "M");
    
    setAddedIds(prev => new Set(prev).add(product.id));
    setTimeout(() => {
      setAddedIds(prev => {
        const next = new Set(prev);
        next.delete(product.id);
        return next;
      });
    }, 2000);
  };

  return (
    <main className="w-full min-h-screen bg-[var(--color-bg)] pb-24">
      {/* Offline Status Banner */}
      <div className="w-full bg-yellow-100 text-yellow-800 text-center py-3 text-xs tracking-wide uppercase font-medium">
        ⚠️ You are currently offline. Browsing limited catalog. Items added to cart will be saved!
      </div>

      <div className="max-w-[1440px] mx-auto px-4 mt-8">
        <h1 className="text-2xl md:text-3xl font-serif tracking-[3px] uppercase text-center mb-8">
          Offline Store
        </h1>
        
        {products.length === 0 ? (
          <div className="text-center text-[var(--color-text-muted)] py-12">
            No products were saved for offline viewing. Please reconnect to the internet.
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-4 gap-y-10">
            {products.map((product) => (
              <div key={product.id} className="group flex flex-col h-full bg-white border border-[var(--color-border)] rounded-lg overflow-hidden">
                <div className="relative w-full aspect-[3/4] bg-gray-50">
                  <Image
                    src={product.image}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 50vw, 25vw"
                  />
                  {product.salePrice && (
                    <div className="absolute top-2 left-2 bg-[var(--color-sale)] text-white text-[10px] tracking-[1px] uppercase px-2 py-1">
                      Sale
                    </div>
                  )}
                </div>
                
                <div className="p-4 flex flex-col flex-1">
                  <h3 className="text-[13px] tracking-[1px] uppercase mb-2 truncate">
                    {product.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[13px] mb-4">
                    {product.salePrice ? (
                      <>
                        <span className="text-[var(--color-sale)] font-medium">
                          Rs. {product.salePrice.toLocaleString("en-IN")}
                        </span>
                        <span className="text-[var(--color-text-muted)] line-through">
                          Rs. {product.price.toLocaleString("en-IN")}
                        </span>
                      </>
                    ) : (
                      <span className="font-medium">Rs. {product.price.toLocaleString("en-IN")}</span>
                    )}
                  </div>

                  <div className="mt-auto pt-4 border-t border-gray-100">
                    <button 
                      onClick={() => handleAddToCart(product)}
                      className={`w-full py-3 text-[11px] font-bold tracking-[1px] uppercase transition-colors rounded ${
                        addedIds.has(product.id) 
                          ? "bg-green-600 text-white" 
                          : "bg-black text-white hover:bg-gray-800"
                      }`}
                    >
                      {addedIds.has(product.id) ? "Added!" : "Quick Add"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
