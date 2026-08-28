"use client";
import { useSiteContentData } from "@/context/SiteContentContext";

export function useSiteContent() {
  return useSiteContentData();
}
