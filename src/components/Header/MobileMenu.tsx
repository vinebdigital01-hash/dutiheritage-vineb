"use client";
import React, { useEffect } from "react";
import Link from "next/link";
import { useAppContext } from "@/context/AppContext";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MobileMenu = ({ isOpen, onClose }: MobileMenuProps) => {
  const { user, logout } = useAppContext();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed top-0 left-0 w-screen h-screen bg-[var(--color-overlay)] z-[200] flex" onClick={onClose}>
      <div 
        className={`w-4/5 max-w-[320px] h-full bg-[var(--color-bg)] shadow-[2px_0_10px_rgba(0,0,0,0.1)] flex flex-col transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <span className="text-sm font-medium tracking-wide">MENU</span>
          <button className="text-[var(--color-text)] flex items-center justify-center p-1" onClick={onClose} aria-label="Close menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>

        <nav className="flex flex-col py-4 flex-1 overflow-y-auto">
          <Link href="/" className="px-4 py-3 text-base border-b border-[var(--color-surface)]" onClick={onClose}>HOME</Link>
          <Link href="/collections/party-wear" className="px-4 py-3 text-base border-b border-[var(--color-surface)]" onClick={onClose}>PARTY WEAR</Link>
          <Link href="/collections/premium-night-wear" className="px-4 py-3 text-base border-b border-[var(--color-surface)]" onClick={onClose}>PREMIUM NIGHT WEAR</Link>
          <Link href="/collections/winter-collection" className="px-4 py-3 text-base border-b border-[var(--color-surface)]" onClick={onClose}>WINTER COLLECTION</Link>
          <Link href="/collections/co-ords" className="px-4 py-3 text-base border-b border-[var(--color-surface)]" onClick={onClose}>CO ORDS</Link>
          <Link href="/collections/vacation" className="px-4 py-3 text-base border-b border-[var(--color-surface)]" onClick={onClose}>PERFECT FOR YOUR VACATION</Link>
          <Link href="/collections/on-sale" className="px-4 py-3 text-base border-b border-[var(--color-surface)]" onClick={onClose}>ON SALE</Link>
        </nav>
        
        <div className="p-4 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col gap-3">
          {user ? (
            <>
              <Link href="/account" className="flex items-center text-sm font-medium" onClick={onClose}>
                My Account
              </Link>
              <button 
                onClick={() => {
                  logout();
                  onClose();
                }} 
                className="text-sm font-medium text-left text-[var(--color-text-muted)] hover:text-black transition-colors"
              >
                Log out
              </button>
            </>
          ) : (
            <Link href="/account" className="flex items-center text-sm font-medium" onClick={onClose}>
              Log in / Create account
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
