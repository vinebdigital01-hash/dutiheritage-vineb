const PRODUCTION_SITE = "https://dutiheritage.co.in";

function isLocalhostUrl(url: string) {
  return /localhost|127\.0\.0\.1/i.test(url);
}

function normalizeOrigin(raw: string) {
  const trimmed = raw.trim().replace(/\/$/, "");
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

/**
 * Public shop URL for emails, sitemap, OG, and canonicals.
 * Ignores localhost even if NEXT_PUBLIC_SITE_URL is still set that way on Vercel.
 */
export function getBaseUrl() {
  const fromEnv = normalizeOrigin(process.env.NEXT_PUBLIC_SITE_URL || "");
  const fromApp = normalizeOrigin(process.env.NEXT_PUBLIC_APP_URL || "");
  const fromVercelProd = normalizeOrigin(
    process.env.VERCEL_PROJECT_PRODUCTION_URL || ""
  );
  const fromVercel = normalizeOrigin(process.env.VERCEL_URL || "");

  const production =
    process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";

  const candidates = production
    ? [fromEnv, fromApp, fromVercelProd, PRODUCTION_SITE]
    : [fromEnv, fromApp, fromVercelProd, fromVercel];

  for (const url of candidates) {
    if (url && !isLocalhostUrl(url)) return url;
  }

  if (!production && fromEnv) return fromEnv;
  if (!production && fromVercel) return fromVercel;
  if (!production) return "http://localhost:3000";
  return PRODUCTION_SITE;
}

/** Same as getBaseUrl — emails must never point at localhost. */
export function getPublicSiteUrl() {
  const url = getBaseUrl();
  if (isLocalhostUrl(url)) return PRODUCTION_SITE;
  return url;
}
