"use client";
import React from "react";

export const PromoBanner = () => {
  return (
    <section className="bg-[var(--color-surface)] text-center py-12 px-4 my-12 w-full">
      <div className="max-w-[600px] mx-auto">
        <h2 className="text-2xl font-medium tracking-[2px] mb-4">JOIN THE DUTI HERITAGE FAMILY</h2>
        <p className="text-base text-[var(--color-text-muted)] mb-10">
          Subscribe to receive updates, access to exclusive deals, and more.
        </p>
        <form className="flex flex-col md:flex-row gap-2" onSubmit={(e) => e.preventDefault()}>
          <input 
            type="email" 
            placeholder="Enter your email address" 
            aria-label="Email address"
            className="flex-1 py-3 px-4 border border-[var(--color-border)] font-inherit text-sm focus:outline-none focus:border-[var(--color-text)] w-full"
            required
          />
          <button 
            type="submit" 
            className="py-3 px-8 bg-[var(--color-accent)] text-[var(--color-bg)] text-sm uppercase tracking-[1px] transition-opacity duration-200 hover:opacity-80"
          >
            Subscribe
          </button>
        </form>
      </div>
    </section>
  );
};
