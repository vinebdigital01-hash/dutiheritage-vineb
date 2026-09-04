"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSiteContent } from "@/hooks/useSiteContent";
import { POLICY_LINKS } from "@/lib/site-content-shared";

export const Footer = () => {
  const content = useSiteContent();
  const footer = content?.footer;

  const companyName = footer?.companyName || "Duti Heritage";
  const phone = footer?.phone || "6901080808";
  const email = footer?.email || "hello@duti-heritage.com";
  const address = footer?.address || "103, Block D, DLF Express Green M1, IMT Manesar, Gurugram, Haryana - 122052";
  const gst = "GSTIN: 06ANFPR1728Q2ZF";
  const copyright = footer?.copyright || ("copy " + new Date().getFullYear() + " Duti Heritage");

  const [subscribeResult, setSubscribeResult] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubscribeSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setSubscribeResult("");
    const formData = new FormData(event.currentTarget);
    formData.append("name", "Newsletter Subscriber");
    formData.append("access_key", "26f12f2a-a465-46c9-9355-892de2f8117d");
    try {
      const response = await fetch("https://api.web3forms.com/submit", { method: "POST", body: formData });
      const data = await response.json();
      if (data.success) {
        setSubscribeResult("Thanks for subscribing!");
        (event.target as HTMLFormElement).reset();
      } else {
        setSubscribeResult("Something went wrong. Try again.");
      }
    } catch (err) {
      setSubscribeResult("Connection error. Try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <footer className="w-full pt-16 pb-8 px-4 border-t border-[var(--color-border)]">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        <div className="flex flex-col text-sm text-[var(--color-text)] space-y-2">
          <h3 className="text-base tracking-[2px] uppercase mb-2">{companyName}</h3>
          <p>Made With Love In India</p>
          {phone && <p>Call Us @ {phone}</p>}
          {email && <p>Email @ {email}</p>}
          {address && <p className="text-[var(--color-text-muted)]">{address}</p>}
          <p className="text-xs text-[var(--color-text-muted)]">{gst}</p>
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
    </footer>
  );
};