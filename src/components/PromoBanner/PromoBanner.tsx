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
    
    const formData = new FormData(event.currentTarget);
    formData.append("name", "Promo Banner Subscriber"); 
    formData.append("access_key", "26f12f2a-a465-46c9-9355-892de2f8117d");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData
      });

      const data = await response.json();
      if (data.success) {
        setSubscribeResult("Thanks for joining the Heritage Club!");
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
