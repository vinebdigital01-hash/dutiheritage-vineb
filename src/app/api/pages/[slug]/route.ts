import { connectDB } from "@/lib/mongodb";
import { Page } from "@/models";
import { requireAuth } from "@/lib/auth";
import {
  handleApiError,
  jsonOk,
  jsonError,
  requireMongo,
  ApiError,
} from "@/lib/api";

type Params = { params: Promise<{ slug: string }> };

/**
 * GET /api/pages/[slug] — public
 * PUT /api/pages/[slug] — admin
 */
export async function GET(_request: Request, { params }: Params) {
  try {
    requireMongo();
    const { slug } = await params;
    await connectDB();
    const doc = await Page.findOne({ slug: slug.toLowerCase() }).lean();
    if (!doc) return jsonError("Page not found", 404);
    return jsonOk({
      page: {
        id: doc._id.toString(),
        slug: doc.slug,
        title: doc.title,
        content: doc.content,
        updatedAt: doc.updatedAt,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(request: Request, { params }: Params) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
    const { slug } = await params;
    const body = await request.json();

    const title = String(body.title || "").trim();
    if (!title) throw new ApiError("title is required");

    await connectDB();
    const doc = await Page.findOneAndUpdate(
      { slug: slug.toLowerCase() },
      {
        $set: {
          title,
          content: String(body.content ?? ""),
          slug: slug.toLowerCase(),
        },
      },
      { upsert: true, new: true }
    );

    return jsonOk({
      page: {
        id: doc._id.toString(),
        slug: doc.slug,
        title: doc.title,
        content: doc.content,
        updatedAt: doc.updatedAt,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
