"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { TrustBadges } from "@/components/TrustBadges";

import { useSiteContent } from "@/hooks/useSiteContent";
import { POLICY_LINKS } from "@/lib/site-content-shared";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z" />
    </svg>
  );
}

function PinterestIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.378l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.85 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 6.045L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

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

  const socials = [
    { href: footer?.instagramUrl, label: "Instagram", Icon: InstagramIcon },
    { href: footer?.facebookUrl, label: "Facebook", Icon: FacebookIcon },
    { href: footer?.pinterestUrl, label: "Pinterest", Icon: PinterestIcon },
    { href: footer?.whatsappUrl, label: "WhatsApp", Icon: WhatsAppIcon },
  ].filter((s) => (s.href || "").trim().length > 0);

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
          {socials.length > 0 ? (
            <div className="flex flex-wrap gap-4 mt-8">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          ) : null}
        </div>
      </div>
      <div className="flex flex-col items-center justify-center text-xs text-[var(--color-text-muted)] gap-2">
        <p>{copyright}</p>
        <p>
          Technical infrastructure by{" "}
          <a href="https://vineb.digital" target="_blank" rel="noopener noreferrer" className="hover:text-[var(--color-text)] transition-colors underline underline-offset-2">
            Vine B Digital
          </a>
        </p>
      </div>
    </div></footer>
  );
};
