import { connectDB } from "@/lib/mongodb";
import { SiteContent } from "@/models";
import { requireAuth } from "@/lib/auth";
import {
  handleApiError,
  jsonOk,
  requireMongo,
} from "@/lib/api";

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
    return jsonOk({
      content: {
        announcementText: doc.announcementText,
        headerNavLinks: doc.headerNavLinks,
        homepageSlugs: doc.homepageSlugs,
        promoBanner: doc.promoBanner,
        footer: doc.footer,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
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
    if (body.footer !== undefined) {
      update.footer = body.footer;
    }

    const doc = await SiteContent.findOneAndUpdate(
      { _id: "global" },
      { $set: update },
      { upsert: true, new: true }
    );

    return jsonOk({
      content: {
        announcementText: doc?.announcementText,
        headerNavLinks: doc?.headerNavLinks,
        homepageSlugs: doc?.homepageSlugs,
        promoBanner: doc?.promoBanner,
        footer: doc?.footer,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
