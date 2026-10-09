import { requireAuth, getAdminApp } from "@/lib/auth";
import { Staff } from "@/models/Staff";
import { connectDB } from "@/lib/mongodb";
import { handleApiError, jsonOk, jsonError } from "@/lib/api";
import { getAuth } from "firebase-admin/auth";
import { STAFF_WRITE } from "@/lib/rbac";
import { logAdminAction } from "@/lib/admin-audit";
import { getPublicSiteUrl } from "@/lib/utils";
import {
  sendEmail,
  emailLayout,
  emailEyebrow,
  emailLead,
  emailNote,
  escHtml,
} from "@/lib/email";

export async function GET(request: Request) {
  try {
    const authUser = await requireAuth(request, { admin: true, roles: STAFF_WRITE });
    await connectDB();
    const staffMembers = await Staff.find().sort({ createdAt: -1 });
    
    const envSuperAdmins = (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean)
      .map((email) => ({
        _id: email,
        email,
        name: "Env Superadmin",
        role: "SUPERADMIN",
        active: true,
        isEnv: true
      }));

    return jsonOk([...envSuperAdmins, ...staffMembers]);
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const authUser = await requireAuth(request, { admin: true, roles: STAFF_WRITE });
    const body = await request.json();

    if (!body.email || !body.name || !body.role) {
      return jsonError("Email, name, and role are required", 400);
    }

    if (!["ADMIN", "MANAGER"].includes(body.role)) {
      return jsonError("Role must be ADMIN or MANAGER", 400);
    }

    await connectDB();
    
    const existing = await Staff.findOne({ email: body.email.toLowerCase() });
    if (existing) {
      return jsonError("Staff member with this email already exists", 400);
    }

    // 1. Ensure user exists in Firebase Auth
    const fbAuth = getAuth(getAdminApp());
    let uid = "";
    try {
      const userRecord = await fbAuth.getUserByEmail(body.email.toLowerCase());
      uid = userRecord.uid;
    } catch (e: any) {
      if (e.code === 'auth/user-not-found') {
        // Create user with a random secure password so they have to reset it
        const newRecord = await fbAuth.createUser({
          email: body.email.toLowerCase(),
          displayName: body.name,
          password: Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10) + "A1!"
        });
        uid = newRecord.uid;
      } else {
        throw e;
      }
    }

    // 2. Add to MongoDB
    const staff = await Staff.create({
      email: body.email.toLowerCase(),
      name: body.name,
      role: body.role,
      active: true,
      addedBy: authUser.email
    });

    // 3. Generate a Password Reset link which redirects to /admin
    const baseUrl = getPublicSiteUrl();
    const resetLink = await fbAuth.generatePasswordResetLink(body.email.toLowerCase(), {
      url: `${baseUrl}/admin/login`
    });

    try {
      await sendEmail({
        to: body.email.toLowerCase(),
        subject: "You have been invited to Duti Heritage admin",
        html: emailLayout(
          `Welcome, ${body.name}`,
          emailEyebrow("Staff invite") +
            emailLead(
              `You have been invited by <strong>${escHtml(authUser.email || "an admin")}</strong> to join the team as <strong>${escHtml(body.role)}</strong>.`
            ) +
            emailNote(
              "Use the button below to set your password and open the admin dashboard. If you already have an account, the same link resets your password."
            ),
          {
            kind: "staff",
            hideDefaultCtas: true,
            primaryCta: { label: "Set password & log in", href: resetLink },
            preheader: `Invited as ${body.role}`,
          }
        ),
        type: "auth",
      });
    } catch (emailErr) {
      console.error("Failed to send staff invite email:", emailErr);
    }

    await logAdminAction({
      request,
      actor: authUser,
      action: "create",
      resource: "staff",
      resourceId: staff._id.toString(),
      message: `${staff.email} as ${staff.role}`,
    });

    return jsonOk(staff);
  } catch (error) {
    return handleApiError(error);
  }
}
