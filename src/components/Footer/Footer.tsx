"use client";

import React from "react";
import Link from "next/link";
import { useSiteContent } from "@/hooks/useSiteContent";
import { POLICY_LINKS } from "@/lib/site-content-server";

export const Footer = () => {
  const content = useSiteContent();
  const footer = content?.footer;

  const companyName =
    footer?.companyName || "DUTI HERITAGE INDIA LIFESTYLE PVT LTD";
  const phone = footer?.phone || "6901080808";
  const email = footer?.email || "hello@duti-heritage.com";
  const address = footer?.address;
  const copyright =
    footer?.copyright || `© ${new Date().getFullYear()} Duti Heritage`;

  return (
    <footer className="w-full pt-16 pb-8 px-4 border-t border-[var(--color-border)]">
      <div className="max-w-[1440px] mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 mb-16">
        <div className="flex flex-col text-sm text-[var(--color-text)] space-y-4">
          <h3 className="text-base tracking-[2px] uppercase mb-2">{companyName}</h3>
          <p>Made With ❤️ In India</p>
          {phone && <p>Call Us @ {phone}</p>}
          {email && <p>Email @ {email}</p>}
          {address && <p>{address}</p>}

          <div className="mt-8">
            <form
              className="flex items-center border-b border-[var(--color-text)] max-w-xs pb-2"
              onSubmit={(e) => e.preventDefault()}
            >
              <input
                type="email"
                placeholder="Enter your email"
                aria-label="Email address"
                className="flex-1 bg-transparent border-none outline-none text-sm"
                required
              />
              <button
                type="submit"
                aria-label="Subscribe"
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                  <path d="M2 4l10 8 10-8"></path>
                </svg>
              </button>
            </form>
          </div>
        </div>

        <div className="flex flex-col text-sm">
          <h3 className="text-base tracking-[2px] uppercase mb-6">IMPORTANT LINKS</h3>
          <ul className="flex flex-col space-y-4 text-[var(--color-text-muted)]">
            {POLICY_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="hover:text-[var(--color-text)] transition-colors"
                >
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
          <a
            href="https://vinebdigital.store"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[var(--color-text)] transition-colors underline underline-offset-2"
          >
            Vine B Digital
          </a>
        </p>
      </div>
    </footer>
  );
};
