import { connectDB } from "@/lib/mongodb";
import { Campaign, CustomerGroup } from "@/models";
import { requireAuth } from "@/lib/auth";
import { resolveGroupMembers } from "@/lib/analytics";
import { sendEmail, emailLayout } from "@/lib/email";
import { sendWhatsApp } from "@/lib/whatsapp";
import {
  handleApiError,
  jsonOk,
  jsonCreated,
  requireMongo,
  ApiError,
  isValidObjectId,
} from "@/lib/api";

/**
 * GET /api/campaigns — history
 * POST /api/campaigns — send email or WhatsApp to a group
 */
export async function GET(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
    await connectDB();

    const limit = Math.min(
      Number(new URL(request.url).searchParams.get("limit") || "50"),
      100
    );

    const docs = await Campaign.find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    return jsonOk({
      campaigns: docs.map((c) => ({
        id: c._id.toString(),
        name: c.name,
        channel: c.channel,
        groupId: c.groupId?.toString(),
        groupName: c.groupName,
        subject: c.subject,
        status: c.status,
        sentAt: c.sentAt,
        stats: c.stats,
        createdAt: c.createdAt,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    requireMongo();
    const authUser = await requireAuth(request, { admin: true });
    await connectDB();

    const body = await request.json();
    const channel = body.channel === "whatsapp" ? "whatsapp" : "email";
    const groupId = String(body.groupId || "");
    if (!isValidObjectId(groupId)) throw new ApiError("Valid groupId required");

    const group = await CustomerGroup.findById(groupId).lean();
    if (!group) throw new ApiError("Group not found", 404);

    const members = await resolveGroupMembers(group, 500);
    if (members.length === 0) throw new ApiError("Group has no members", 400);

    const name = String(body.name || `${channel} — ${group.name}`).slice(0, 120);
    const subject = String(body.subject || "").slice(0, 200);
    const htmlBody = String(body.body || "").slice(0, 20_000);
    const templateName = body.templateName ? String(body.templateName) : undefined;

    if (channel === "email" && !subject) {
      throw new ApiError("subject is required for email campaigns");
    }
    if (channel === "email" && !htmlBody) {
      throw new ApiError("body is required for email campaigns");
    }

    let sent = 0;
    let failed = 0;

    for (const member of members) {
      if (channel === "email") {
        if (!member.email) {
          failed++;
          continue;
        }
        const r = await sendEmail({
          to: member.email,
          subject,
          html: emailLayout(subject, htmlBody),
          type: "marketing",
          text: htmlBody.replace(/<[^>]+>/g, " "),
        });
        if (r.ok && !r.skipped) sent++;
        else if (!r.skipped) failed++;
      } else {
        if (!member.phone) {
          failed++;
          continue;
        }
        const msg = htmlBody || subject || `Message from Duti Heritage`;
        const r = await sendWhatsApp({
          phone: member.phone,
          message: msg,
          templateName,
          templateParams: body.templateParams,
        });
        if (r.ok && !r.skipped) sent++;
        else if (!r.skipped) failed++;
      }
    }

    const campaign = await Campaign.create({
      name,
      channel,
      groupId,
      groupName: group.name,
      subject: channel === "email" ? subject : undefined,
      body: htmlBody,
      templateName,
      status: failed === members.length ? "failed" : "sent",
      sentAt: new Date(),
      createdBy: authUser.email || authUser.uid,
      stats: {
        sent,
        failed,
        delivered: sent,
      },
    });

    return jsonCreated({
      campaign: {
        id: campaign._id.toString(),
        stats: campaign.stats,
      },
      recipients: members.length,
      sent,
      failed,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
