"use client";
import React, { createContext, useContext } from "react";
import type { SiteContentData } from "@/lib/site-content-shared";

const SiteContentContext = createContext<SiteContentData | null>(null);

export function SiteContentProvider({
  content,
  children,
}: {
  content: SiteContentData;
  children: React.ReactNode;
}) {
  return (
    <SiteContentContext.Provider value={content}>
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContentData() {
  return useContext(SiteContentContext);
}
