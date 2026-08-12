import React from "react";
import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Offline | Duti Heritage",
  description: "You are currently offline.",
};

export default function OfflinePage() {
  return (
    <main className="w-full min-h-[70vh] flex flex-col items-center justify-center bg-[var(--color-bg)] px-4">
      <div className="text-center max-w-md">
        <svg 
          width="48" 
          height="48" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5"
          className="mx-auto mb-6 text-[var(--color-text-muted)]"
        >
          <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.58 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01" />
        </svg>
        <h1 className="text-2xl font-serif tracking-[2px] uppercase mb-4">
          You are offline
        </h1>
        <p className="text-[var(--color-text-muted)] mb-8">
          It looks like you've lost your internet connection. Please check your network and try again.
        </p>
        <Link 
          href="/" 
          className="inline-block bg-[var(--color-text)] text-[var(--color-bg)] px-8 py-4 text-[13px] font-medium tracking-[1.5px] uppercase hover:opacity-90 transition-opacity"
        >
          Go to Homepage
        </Link>
      </div>
    </main>
  );
}
