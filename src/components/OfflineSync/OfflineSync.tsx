"use client";
import { useEffect } from "react";
import { Product } from "@/types";

export function OfflineSync({ products }: { products: Product[] }) {
  useEffect(() => {
    // Save the lightweight catalog to localStorage for offline fallback use
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("duti-heritage_offline_catalog", JSON.stringify(products));
      } catch (err) {
        console.error("Failed to sync offline catalog", err);
      }
    }
  }, [products]);

  return null; // This is a headless component, it renders nothing!
}
