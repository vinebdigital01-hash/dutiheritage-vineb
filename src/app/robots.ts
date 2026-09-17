import { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = getBaseUrl();

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/account/", 
        "/checkout/", 
        "/api/", 
        "/_next/",
        "/admin/"
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
