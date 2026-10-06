"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { TrustBadges } from "@/components/TrustBadges";

import { useSiteContent } from "@/hooks/useSiteContent";
import { POLICY_LINKS } from "@/lib/site-content-shared";

export const Footer = () => {
  const pathname = usePathname();
  const isCheckout = pathname?.startsWith("/checkout");
  const content = useSiteContent();
  const footer = content?.footer;

  const companyName = footer?.companyName || "Duti Heritage";
  const phone = footer?.phone || "";
  const email = footer?.email || "";
  const address = footer?.address || "";
  const gstin = footer?.gstin || "";
  const year = new Date().getFullYear();
  const copyright =
    footer?.copyright?.trim() || `© ${year} ${companyName}`;

  const [subscribeResult, setSubscribeResult] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubscribeSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubscribeResult("");
    const form = event.currentTarget;
    const emailValue = String(new FormData(form).get("email") || "").trim();
    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue, source: "footer" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setSubscribeResult(data.error || "Something went wrong. Try again.");
      } else {
        setSubscribeResult(data.message || "Thanks for subscribing!");
        form.reset();
      }
    } catch {
      setSubscribeResult("Connection error. Try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <footer className="w-full bg-white relative z-50">
        <div className="max-w-[1440px] mx-auto px-4">{!isCheckout && <TrustBadges />}</div>
        <div className="w-full pt-16 pb-8 px-4 border-t border-[var(--color-border)]">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        <div className="flex flex-col text-sm text-[var(--color-text)] space-y-2">
          <h3 className="text-base tracking-[2px] uppercase mb-2">{companyName}</h3>
          <p>Made With Love In India</p>
          {phone ? <p>Call Us @ {phone}</p> : null}
          {email ? <p>Email @ {email}</p> : null}
          {address ? <p className="text-[var(--color-text-muted)]">{address}</p> : null}
          {gstin ? (
            <p className="text-xs text-[var(--color-text-muted)]">GSTIN: {gstin}</p>
          ) : null}
          <div className="mt-8">
            <form
              className="flex items-center border-b border-[var(--color-text)] max-w-xs pb-2"
              onSubmit={onSubscribeSubmit}
            >
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                aria-label="Email address"
                className="flex-1 bg-transparent border-none outline-none text-sm"
                required
              />
              <button
                type="submit"
                disabled={isSubmitting}
                aria-label="Subscribe"
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="M2 4l10 8 10-8"></path>
                </svg>
              </button>
            </form>
            {subscribeResult && <p className="text-xs mt-2 text-green-600">{subscribeResult}</p>}
          </div>
        </div>
        <div className="flex flex-col text-sm">
          <h3 className="text-base tracking-[2px] uppercase mb-6">IMPORTANT LINKS</h3>
          <ul className="flex flex-col space-y-4 text-[var(--color-text-muted)]">
            {POLICY_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-[var(--color-text)] transition-colors">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex flex-col items-center justify-center text-xs text-[var(--color-text-muted)] gap-2">
        <p>{copyright}</p>
        <p>
          Made by{" "}
          <a href="https://vinebdigital.store" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-text)] transition-colors underline underline-offset-2">
            Vine B Digital
          </a>
        </p>
      </div>
    </div></footer>
  );
};
