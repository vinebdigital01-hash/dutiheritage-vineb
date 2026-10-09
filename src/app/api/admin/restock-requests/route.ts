import { connectDB } from "@/lib/mongodb";
import { RestockRequest } from "@/models/RestockRequest";
import { Product } from "@/models/Product";
import { requireAuth } from "@/lib/auth";
import { jsonOk, jsonError, handleApiError, requireMongo } from "@/lib/api";
import { sendEmail, emailLayout } from "@/lib/email";
import { getPublicSiteUrl } from "@/lib/utils";

// GET all requests
export async function GET(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
    await connectDB();

    const requests = await RestockRequest.find()
      .sort({ createdAt: -1 })
      .lean();
    
    return jsonOk({ requests });
  } catch (err) {
    return handleApiError(err);
  }
}

// POST: Mark as notified and send email
export async function POST(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
    await connectDB();

    const { requestId } = await request.json();
    if (!requestId) return jsonError("Request ID required", 400);

    const restockReq = await RestockRequest.findById(requestId);
    if (!restockReq) return jsonError("Not found", 404);
    if (restockReq.status === "notified") return jsonError("Already notified", 400);

    const product = await Product.findById(restockReq.productId);
    if (!product) return jsonError("Product no longer exists", 404);

    const url = `${getPublicSiteUrl()}/products/${product.slug}`;
    
    const html = emailLayout(
      "Good News: Back in Stock!",
      `
        <p>Hi there,</p>
        <p>You asked us to let you know when <strong>${restockReq.productName}</strong> ${restockReq.size ? `(Size: ${restockReq.size})` : ''} was back in stock.</p>
        <p>Good news! It's available right now. Click the button below to grab yours before it sells out again.</p>
        <br/>
        <a href="${url}" style="display:inline-block;padding:12px 24px;background-color:#000000;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Shop Now</a>
      `,
      { footerMessage: "Enjoy shopping with Duti Heritage!" }
    );

    const emailResult = await sendEmail({
      to: restockReq.email,
      subject: `Back in stock: ${restockReq.productName}`,
      html,
      type: "marketing",
    });

    if (!emailResult.ok && !emailResult.skipped) {
      return jsonError("Failed to send email: " + emailResult.error, 500);
    }

    restockReq.status = "notified";
    await restockReq.save();

    return jsonOk({ success: true, message: "Customer notified successfully!" });
  } catch (err) {
    return handleApiError(err);
  }
}
