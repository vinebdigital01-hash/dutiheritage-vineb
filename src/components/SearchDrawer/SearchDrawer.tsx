"use client";
import React, { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";
import { searchProducts, getTopCollections } from "@/app/actions";
import { Product, Collection } from "@/types";

export const SearchDrawer = () => {
  const { isSearchOpen, setIsSearchOpen } = useAppContext();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [suggestedCollections, setSuggestedCollections] = useState<Collection[]>([]);
  const [, startTransition] = useTransition();

  useEffect(() => {
    getTopCollections().then(setSuggestedCollections);
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setResults([]);
      return;
    }
    
    const timer = setTimeout(() => {
      startTransition(async () => {
        const found = await searchProducts(searchQuery);
        setResults(found);
      });
    }, 300); // debounce

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Close when clicking outside or navigating
  useEffect(() => {
    if (!isSearchOpen) {
      const timer = setTimeout(() => setSearchQuery(""), 0);
      return () => clearTimeout(timer);
    }
  }, [isSearchOpen]);

  if (!isSearchOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-[60] transition-opacity"
        onClick={() => setIsSearchOpen(false)}
      />

      {/* Drawer */}
      <div className="fixed top-0 left-0 w-full bg-[var(--color-surface)] z-[70] shadow-2xl flex flex-col animate-in slide-in-from-top duration-300 max-h-[80vh]">
        
        {/* Header & Input */}
        <div className="p-4 md:p-6 border-b border-[var(--color-border)] flex items-center justify-between gap-4 max-w-[1440px] mx-auto w-full">
          <div className="flex-1 flex items-center gap-4 bg-[var(--color-bg)] px-4 py-3 rounded-md">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <input
              type="text"
              placeholder="Search for products..."
              aria-label="Search products"
              className="flex-1 bg-transparent border-none outline-none text-[14px]"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="text-[var(--color-text-muted)] hover:text-black">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
              </button>
            )}
          </div>
          <button onClick={() => setIsSearchOpen(false)} className="p-2 hover:bg-[var(--color-border)] transition-colors rounded-full shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 max-w-[1440px] mx-auto w-full">
          {searchQuery.trim() !== "" && (
            <div className="mb-6 flex justify-between items-end">
              <h3 className="text-[12px] tracking-[2px] uppercase text-[var(--color-text-muted)]">
                {results.length} result{results.length !== 1 ? 's' : ''} found
              </h3>
            </div>
          )}

          {searchQuery.trim() === "" ? (
            <div>
              <div className="mb-6 flex justify-between items-end">
                <h3 className="text-[12px] tracking-[2px] uppercase text-[var(--color-text-muted)]">
                  Suggested Categories
                </h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {suggestedCollections.map((collection) => (
                  <Link
                    href={`/collections/${collection.slug}`}
                    key={collection.id}
                    onClick={() => setIsSearchOpen(false)}
                    className="border border-[var(--color-border)] bg-[var(--color-bg)] px-6 py-3 text-[12px] tracking-[1px] uppercase hover:border-[var(--color-text)] transition-colors"
                  >
                    {collection.name}
                  </Link>
                ))}
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="text-center py-12 text-[var(--color-text-muted)]">
              <p className="text-[14px]">No products match your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {results.slice(0, 12).map((product) => (
                <Link
                  href={`/products/${product.slug}`}
                  key={product.id}
                  onClick={() => setIsSearchOpen(false)}
                  className="group flex flex-col items-center text-center"
                >
                  <div className="relative w-full aspect-[3/4] bg-gray-50 mb-3 overflow-hidden">
                    <Image
                      src={product.image}
                      alt={product.name}
                      fill
                      sizes="60px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <h4 className="text-[11px] tracking-[1px] uppercase truncate w-full">{product.name}</h4>
                  <p className="text-[12px] text-[var(--color-text-muted)] mt-1">Rs. {product.price.toLocaleString("en-IN")}</p>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
