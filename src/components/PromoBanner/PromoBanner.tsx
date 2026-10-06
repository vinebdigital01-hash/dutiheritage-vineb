"use client";

import React, { useState } from "react";
import { useSiteContent } from "@/hooks/useSiteContent";

export const PromoBanner = () => {
  const content = useSiteContent();
  const promo = content?.promoBanner;

  const headline = promo?.headline || "JOIN THE DUTI HERITAGE FAMILY";
  const subtext =
    promo?.subtext ||
    "Subscribe to receive updates, access to exclusive deals, and more.";
  const buttonText = promo?.buttonText || "Subscribe";

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
        body: JSON.stringify({ email: emailValue, source: "promo" }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setSubscribeResult(data.error || "Something went wrong. Try again.");
      } else {
        setSubscribeResult(data.message || "Thanks for joining the Heritage Club!");
        form.reset();
      }
    } catch {
      setSubscribeResult("Connection error. Try again.");
    }
    setIsSubmitting(false);
  };

  return (
    <section className="bg-[var(--color-surface)] text-center py-12 px-4 my-12 w-full">
      <div className="max-w-[600px] mx-auto">
        <h2 className="text-2xl font-medium tracking-[2px] mb-4">{headline}</h2>
        <p className="text-base text-[var(--color-text-muted)] mb-10">{subtext}</p>
        <form
          className="flex flex-col md:flex-row gap-2"
          onSubmit={onSubscribeSubmit}
        >
          <input
            type="email"
            name="email"
            placeholder="Enter your email address"
            aria-label="Email address"
            className="flex-1 py-3 px-4 border border-[var(--color-border)] font-inherit text-sm focus:outline-none focus:border-[var(--color-text)] w-full"
            required
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="py-3 px-8 bg-[var(--color-accent)] text-[var(--color-bg)] text-sm uppercase tracking-[1px] transition-opacity duration-200 hover:opacity-80 disabled:opacity-50"
          >
            {isSubmitting ? "Subscribing..." : buttonText}
          </button>
        </form>
        {subscribeResult && <p className="text-sm mt-4 text-[var(--color-text)]">{subscribeResult}</p>}
      </div>
    </section>
  );
};
