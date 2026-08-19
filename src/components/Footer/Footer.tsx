"use client";
import React from "react";
import Link from "next/link";

export const Footer = () => {
  return (
    <footer className="w-full pt-16 pb-8 px-4 border-t border-[var(--color-border)]">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        {/* Left Column */}
        <div className="flex flex-col text-sm text-[var(--color-text)] space-y-4">
          <h3 className="text-base tracking-[2px] uppercase mb-2">DUTI HERITAGE INDIA LIFESTYLE PVT LTD</h3>
          <p>Made With ❤️ In India</p>
          <p>Call Us @ 6901080808</p>
          <p>Email @ hello@duti-heritage.com</p>
          
          <div className="mt-8">
            <form className="flex items-center border-b border-[var(--color-text)] max-w-xs pb-2" onSubmit={(e) => e.preventDefault()}>
              <input 
                type="email" 
                placeholder="Enter your email" 
                aria-label="Email address"
                className="flex-1 bg-transparent border-none outline-none text-sm"
                required
              />
              <button type="submit" aria-label="Subscribe" className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="M2 4l10 8 10-8"></path>
                </svg>
              </button>
            </form>
          </div>
        </div>

        {/* Right Column */}
        <div className="flex flex-col text-sm">
          <h3 className="text-base tracking-[2px] uppercase mb-6">IMPORTANT LINKS</h3>
          <ul className="flex flex-col space-y-4 text-[var(--color-text-muted)]">
            <li><Link href="/privacy-policy" className="hover:text-[var(--color-text)] transition-colors">Privacy Policy</Link></li>
            <li><Link href="/return-exchange" className="hover:text-[var(--color-text)] transition-colors">Return/Exchange Policy</Link></li>
            <li><Link href="/terms-conditions" className="hover:text-[var(--color-text)] transition-colors">Terms & Conditions</Link></li>
            <li><Link href="/shipping" className="hover:text-[var(--color-text)] transition-colors">Shipping Policy</Link></li>
          </ul>
        </div>
      </div>

      {/* Bottom Copyright */}
      <div className="flex flex-col items-center justify-center text-xs text-[var(--color-text-muted)] gap-2">
        <p>© {new Date().getFullYear()} Duti Heritage</p>
        <p>
          Made by <a href="https://vinebdigital.store" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-text)] transition-colors underline underline-offset-2">Vine B Digital</a>
        </p>
      </div>
    </footer>
  );
};
