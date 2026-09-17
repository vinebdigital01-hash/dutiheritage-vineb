import { connectDB } from "@/lib/mongodb";
import { Product } from "@/models";
import { requireAuth } from "@/lib/auth";
import { CATALOG_WRITE } from "@/lib/rbac";
import { handleApiError, jsonOk, requireMongo } from "@/lib/api";

export async function POST(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true, roles: CATALOG_WRITE });
    await connectDB();
    const { updates }: { updates: { slug: string; offers: unknown[] }[] } =
      await request.json();
    if (!updates || !Array.isArray(updates)) {
      throw new Error("Invalid payload: expected updates array");
    }
    let updatedCount = 0;
    for (const row of updates) {
      if (!row.slug) continue;
      const res = await Product.updateOne(
        { slug: row.slug },
        { $set: { offers: row.offers || [] } }
      );
      if (res.modifiedCount > 0) updatedCount++;
    }
    return jsonOk({ updated: updatedCount });
  } catch (error) {
    return handleApiError(error);
  }
}
