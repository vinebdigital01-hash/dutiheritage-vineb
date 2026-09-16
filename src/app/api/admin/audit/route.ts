import { requireAuth } from "@/lib/auth";
import { AUDIT_READ } from "@/lib/rbac";
import { connectDB } from "@/lib/mongodb";
import { AdminAudit } from "@/models";
import { handleApiError, jsonOk, requireMongo } from "@/lib/api";

export async function GET(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true, roles: AUDIT_READ });
    await connectDB();

    const { searchParams } = new URL(request.url);
    const q = String(searchParams.get("q") || "").trim();
    const page = Math.max(1, Number(searchParams.get("page") || "1") || 1);
    const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") || "50") || 50));

    const filter: Record<string, unknown> = {};
    if (q) {
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { actor: rx },
        { action: rx },
        { resource: rx },
        { resourceId: rx },
        { message: rx },
      ];
    }

    const [docs, total] = await Promise.all([
      AdminAudit.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      AdminAudit.countDocuments(filter),
    ]);

    return jsonOk({
      items: docs.map((d) => ({
        id: d._id.toString(),
        actor: d.actor,
        role: d.role || "",
        action: d.action,
        resource: d.resource,
        resourceId: d.resourceId || "",
        message: d.message || "",
        path: d.path || "",
        ip: d.ip || "",
        createdAt: d.createdAt,
      })),
      total,
      page,
      limit,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
