import { connectDB } from "@/lib/mongodb";
import { SiteContent, Page } from "@/models";
import type { SiteContentData } from "@/lib/site-content-shared";

export type { NavLink, SiteContentData } from "@/lib/site-content-shared";
export {
  DEFAULT_HOMEPAGE_SLUGS,
  DEFAULT_HEADER_NAV,
  POLICY_LINKS,
  navHref,
  resolveHomepageSlugs,
  resolveHeaderNav,
  liveHeroBanners,
} from "@/lib/site-content-shared";

/** Server-side site content for pages / layout. */
export async function getSiteContent(): Promise<SiteContentData> {
  if (!process.env.MONGODB_URI) return {};

  try {
    await connectDB();
    const doc = await SiteContent.findById("global").lean();
    if (!doc) return {};
    return {
      announcementText: doc.announcementText,
      headerNavLinks: doc.headerNavLinks as SiteContentData["headerNavLinks"],
      homepageSlugs: doc.homepageSlugs as string[] | undefined,
      heroBanners: (doc.heroBanners || []).map((b) => ({
        id: (b as { _id?: { toString(): string } })._id?.toString(),
        image: String((b as { image?: string }).image || ""),
        href: String((b as { href?: string }).href || ""),
        headline: String((b as { headline?: string }).headline || ""),
        subtext: String((b as { subtext?: string }).subtext || ""),
        startsAt: (b as { startsAt?: Date }).startsAt
          ? new Date((b as { startsAt: Date }).startsAt).toISOString()
          : null,
        endsAt: (b as { endsAt?: Date }).endsAt
          ? new Date((b as { endsAt: Date }).endsAt).toISOString()
          : null,
        active: (b as { active?: boolean }).active !== false,
      })),
      promoBanner: doc.promoBanner as SiteContentData["promoBanner"],
      footer: doc.footer as SiteContentData["footer"],
    };
  } catch {
    return {};
  }
}

/** CMS policy page from Mongo; null if not configured. */
export async function getPageContent(slug: string) {
  if (!process.env.MONGODB_URI) return null;

  try {
    await connectDB();
    const doc = await Page.findOne({ slug: slug.toLowerCase() }).lean();
    if (!doc?.content?.trim()) return null;
    return {
      title: doc.title,
      content: doc.content,
      updatedAt: doc.updatedAt,
    };
  } catch {
    return null;
  }
}
