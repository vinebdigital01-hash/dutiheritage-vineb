import { requireAuth, getAdminApp } from "@/lib/auth";
import { Staff } from "@/models/Staff";
import { connectDB } from "@/lib/mongodb";
import { handleApiError, jsonOk, jsonError } from "@/lib/api";
import { getAuth } from "firebase-admin/auth";

export async function GET(request: Request) {
  try {
    const authUser = await requireAuth(request, { admin: true, roles: ["SUPERADMIN"] });
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
    const authUser = await requireAuth(request, { admin: true, roles: ["SUPERADMIN"] });
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
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://dutiheritage.co.in";
    const resetLink = await fbAuth.generatePasswordResetLink(body.email.toLowerCase(), {
      url: `${baseUrl}/admin`
    });

    // 4. Send Email using explicit Resend API key and From address
    try {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_AUTH_KEY || process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: "Duti Heritage <admin@dutiheritage.co.in>",
          to: [body.email.toLowerCase()],
          subject: "You have been invited as Staff to Duti Heritage",
          html: `
            <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
              <h2>Welcome to Duti Heritage, ${body.name}!</h2>
              <p>You have been invited by <strong>${authUser.email}</strong> to join the Duti Heritage team as a <strong>${body.role}</strong>.</p>
              <p>To get started, please click the link below to set your password and access the Admin Dashboard.</p>
              <a href="${resetLink}" style="display: inline-block; padding: 12px 24px; background-color: #000; color: #fff; text-decoration: none; border-radius: 6px; margin: 20px 0;">Set Password & Login</a>
              <p style="color: #666; font-size: 14px;">If you already have an account, this link will allow you to reset your password and login securely.</p>
            </div>
          `,
        }),
      });
    } catch (emailErr) {
      console.error("Failed to send staff invite email:", emailErr);
    }

    return jsonOk(staff);
  } catch (error) {
    return handleApiError(error);
  }
}
