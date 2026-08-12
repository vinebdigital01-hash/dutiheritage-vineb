"use client";
import React, { useState } from "react";
import Link from "next/link";
import { MobileMenu } from "./MobileMenu";
import { useAppContext } from "@/context/AppContext";

export const Header = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { cart, setIsCartOpen, setIsSearchOpen, isInitialized } = useAppContext();

  return (
    <>
      <header className="sticky top-0 bg-[var(--color-bg)] border-b border-[var(--color-border)] z-50 w-full">
        <div className="flex items-center justify-between px-4 h-[60px] md:h-[80px] max-w-[1440px] mx-auto">
          
          {/* LEFT SECTION */}
          <div className="flex items-center flex-1">
            <button
              className="flex items-center justify-center text-[var(--color-text)] xl:hidden"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
              </svg>
            </button>

            <div className="hidden xl:flex items-center justify-center">
              <button onClick={() => setIsSearchOpen(true)} className="flex items-center justify-center text-[var(--color-text)] hover:opacity-70 transition-opacity" aria-label="Search">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
            </div>

            <nav className="hidden xl:flex flex-col gap-2 ml-10 items-start">
              <div className="flex gap-6">
                <Link href="/" className="text-[14px] tracking-wide uppercase hover:opacity-70 transition-opacity">HOME</Link>
                <Link href="/collections/party-wear" className="text-[14px] tracking-wide uppercase hover:opacity-70 transition-opacity">PARTY WEAR</Link>
              </div>
              <div className="flex gap-6">
                <Link href="/collections/premium-night-wear" className="text-[14px] tracking-wide uppercase hover:opacity-70 transition-opacity">PREMIUM NIGHT WEAR</Link>
              </div>
            </nav>
          </div>

          {/* CENTER SECTION */}
          <div className="flex-[2] md:flex-1 flex justify-center items-center text-center">
            <Link href="/" className="text-[18px] sm:text-xl md:text-2xl lg:text-3xl font-normal tracking-[2px] lg:tracking-[3px] uppercase font-serif whitespace-nowrap leading-none mt-1 md:mt-0">
              DUTI HERITAGE
            </Link>
          </div>

          {/* RIGHT SECTION */}
          <div className="flex items-center justify-end flex-1">
            <nav className="hidden xl:flex flex-col gap-2 mr-10 items-end">
              <div className="flex gap-6">
                <Link href="/collections/winter-collection" className="text-[14px] tracking-wide uppercase hover:opacity-70 transition-opacity">WINTER COLLECTION</Link>
                <Link href="/collections/co-ords" className="text-[14px] tracking-wide uppercase hover:opacity-70 transition-opacity">CO ORDS</Link>
              </div>
              <div className="flex gap-6">
                <Link href="/collections/vacation" className="text-[14px] tracking-wide uppercase hover:opacity-70 transition-opacity">PERFECT FOR YOUR VACATION</Link>
                <Link href="/collections/on-sale" className="text-[14px] tracking-wide uppercase hover:opacity-70 transition-opacity">ON SALE</Link>
              </div>
            </nav>

            <div className="flex items-center gap-4">
              <button onClick={() => setIsSearchOpen(true)} className="flex xl:hidden items-center justify-center text-[var(--color-text)] hover:opacity-70 transition-opacity" aria-label="Search">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"></circle>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
              </button>
              <Link href="/account" className="hidden xl:flex items-center justify-center text-[var(--color-text)] hover:opacity-70 transition-opacity" aria-label="Account">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </Link>
              <button onClick={() => setIsCartOpen(true)} className="flex items-center justify-center text-[var(--color-text)] relative hover:opacity-70 transition-opacity" aria-label="Cart">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                  <line x1="3" y1="6" x2="21" y2="6"></line>
                  <path d="M16 10a4 4 0 0 1-8 0"></path>
                </svg>
                {isInitialized && cart.length > 0 && (
                  <span className="absolute -top-2 -right-2 bg-[var(--color-text)] text-[var(--color-bg)] text-[10px] w-4 h-4 flex items-center justify-center rounded-full">
                    {cart.length}
                  </span>
                )}
              </button>
            </div>
          </div>
          
        </div>
      </header>
      
      <MobileMenu 
        isOpen={isMobileMenuOpen} 
        onClose={() => setIsMobileMenuOpen(false)} 
      />
    </>
  );
};
