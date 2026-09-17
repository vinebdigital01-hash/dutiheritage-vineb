import { revalidatePath } from "next/cache";
import { connectDB } from "@/lib/mongodb";
import { SiteContent } from "@/models";
import { requireAuth } from "@/lib/auth";
import { SETTINGS_WRITE } from "@/lib/rbac";
import { logAdminAction } from "@/lib/admin-audit";
import {
  handleApiError,
  jsonOk,
  requireMongo,
} from "@/lib/api";

function serializeHeroBanners(banners: unknown): Array<{
  id?: string;
  image: string;
  href: string;
  headline: string;
  subtext: string;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
}> {
  if (!Array.isArray(banners)) return [];
  return banners
    .map((raw) => {
      const b = raw as {
        _id?: { toString(): string };
        image?: string;
        href?: string;
        headline?: string;
        subtext?: string;
        startsAt?: Date;
        endsAt?: Date;
        active?: boolean;
      };
      if (!b.image) return null;
      return {
        id: b._id?.toString(),
        image: String(b.image),
        href: String(b.href || ""),
        headline: String(b.headline || ""),
        subtext: String(b.subtext || ""),
        startsAt: b.startsAt ? new Date(b.startsAt).toISOString() : null,
        endsAt: b.endsAt ? new Date(b.endsAt).toISOString() : null,
        active: b.active !== false,
      };
    })
    .filter((b): b is NonNullable<typeof b> => Boolean(b));
}

async function getOrCreateSiteContent() {
  await connectDB();
  let doc = await SiteContent.findById("global");
  if (!doc) {
    doc = await SiteContent.create({ _id: "global" });
  }
  return doc;
}

/**
 * GET /api/site-content — public
 * PUT /api/site-content — admin
 */
export async function GET() {
  try {
    requireMongo();
    const doc = await getOrCreateSiteContent();
    return new Response(
      JSON.stringify({
        content: {
          announcementText: doc.announcementText,
          headerNavLinks: doc.headerNavLinks,
          homepageSlugs: doc.homepageSlugs,
          heroBanners: serializeHeroBanners(doc.heroBanners),
          promoBanner: doc.promoBanner,
          footer: doc.footer,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
        },
      }
    );
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    requireMongo();
    const authUser = await requireAuth(request, { admin: true, roles: SETTINGS_WRITE });
    await connectDB();

    const body = await request.json();
    const update: Record<string, unknown> = {};

    if (body.announcementText !== undefined) {
      update.announcementText = String(body.announcementText);
    }
    if (body.headerNavLinks !== undefined) {
      update.headerNavLinks = body.headerNavLinks;
    }
    if (body.homepageSlugs !== undefined) {
      update.homepageSlugs = body.homepageSlugs;
    }
    if (body.promoBanner !== undefined) {
      update.promoBanner = body.promoBanner;
    }
    if (body.heroBanners !== undefined && Array.isArray(body.heroBanners)) {
      update.heroBanners = body.heroBanners
        .map((b: {
          image?: string;
          href?: string;
          headline?: string;
          subtext?: string;
          startsAt?: string | null;
          endsAt?: string | null;
          active?: boolean;
        }) => ({
          image: String(b.image || "").trim(),
          href: String(b.href || "").trim(),
          headline: String(b.headline || "").trim(),
          subtext: String(b.subtext || "").trim(),
          startsAt: b.startsAt ? new Date(b.startsAt) : undefined,
          endsAt: b.endsAt ? new Date(b.endsAt) : undefined,
          active: b.active !== false,
        }))
        .filter((b: { image: string }) => b.image);
    }
    if (body.footer !== undefined) {
      update.footer = body.footer;
    }

    const doc = await SiteContent.findOneAndUpdate(
      { _id: "global" },
      { $set: update },
      { upsert: true, new: true }
    );
    revalidatePath("/");
    revalidatePath("/", "layout");
    await logAdminAction({
      request,
      actor: authUser,
      action: "update",
      resource: "settings",
      resourceId: "site-content",
      message: "Updated site content",
    });

    return jsonOk({
      content: {
        announcementText: doc?.announcementText,
        headerNavLinks: doc?.headerNavLinks,
        homepageSlugs: doc?.homepageSlugs,
        heroBanners: serializeHeroBanners(doc?.heroBanners),
        promoBanner: doc?.promoBanner,
        footer: doc?.footer,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
