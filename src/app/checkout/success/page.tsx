"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  return (
    <main className="w-full min-h-[80vh] flex flex-col items-center justify-center px-4 py-16 bg-[var(--color-bg)]">
      <div className="max-w-[600px] w-full text-center">
        <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        </div>

        <h1 className="text-3xl font-serif tracking-[2px] uppercase mb-4">Order Confirmed</h1>

        {orderId && (
          <p className="text-[15px] font-medium mb-4">
            Order ID:{" "}
            <span className="font-mono tracking-wide text-black">{orderId}</span>
          </p>
        )}

        <p className="text-[var(--color-text-muted)] mb-8 leading-relaxed">
          Thank you for your purchase! We have received your order and will process it shortly.
          You can track status anytime from your account.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/account"
            className="inline-block border border-black px-10 py-4 text-[13px] tracking-[2px] uppercase hover:bg-black hover:text-white transition-colors"
          >
            View Account
          </Link>
          <Link
            href="/collections/all"
            className="inline-block bg-black text-white px-10 py-4 text-[13px] tracking-[2px] uppercase hover:bg-black/90 transition-colors"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <main className="w-full min-h-[80vh] flex items-center justify-center">
          <p className="text-[var(--color-text-muted)] animate-pulse">Loading...</p>
        </main>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
