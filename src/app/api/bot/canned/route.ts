import { connectDB } from "@/lib/mongodb";
import { WhatsAppCannedReply } from "@/models";
import { requireAuth } from "@/lib/auth";
import { OPS_WRITE } from "@/lib/rbac";
import { handleApiError, jsonOk, jsonCreated, requireMongo, ApiError } from "@/lib/api";

const DEFAULTS = [
  { title: "Ask for order ID", body: "Hi! Please share your order ID (starts with DH-) and I’ll check this for you." },
  { title: "Checking now", body: "Thanks for waiting — I’m checking this with the team and will update you shortly." },
  { title: "Return received", body: "We’ve noted your return request. Our team will confirm pickup/refund next." },
];

export async function GET(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true, roles: OPS_WRITE });
    await connectDB();

    let docs = await WhatsAppCannedReply.find().sort({ createdAt: 1 }).lean();
    if (docs.length === 0) {
      await WhatsAppCannedReply.insertMany(DEFAULTS);
      docs = await WhatsAppCannedReply.find().sort({ createdAt: 1 }).lean();
    }

    return jsonOk({
      replies: docs.map((d) => ({
        id: d._id.toString(),
        title: d.title,
        body: d.body,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    requireMongo();
    const authUser = await requireAuth(request, { admin: true, roles: OPS_WRITE });
    await connectDB();
    const body = await request.json();
    const title = String(body.title || "").trim();
    const text = String(body.body || "").trim();
    if (!title || !text) throw new ApiError("title and body are required");

    const doc = await WhatsAppCannedReply.create({
      title,
      body: text,
      createdBy: authUser.email,
    });
    return jsonCreated({
      reply: { id: doc._id.toString(), title: doc.title, body: doc.body },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
