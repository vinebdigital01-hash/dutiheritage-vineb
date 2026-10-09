import { RestockRequest } from "@/models/RestockRequest";
import { getPublicSiteUrl } from "@/lib/utils";
import { sendEmail, emailLayout } from "@/lib/email";
import { connectDB } from "@/lib/mongodb";

export async function processAutoRestockEmails(input: {
  productId: string;
  productName: string;
  size: string;
  prevStock: number;
  nextStock: number;
}) {
  const { productId, productName, size, prevStock, nextStock } = input;
  
  if (prevStock > 0 || nextStock <= 0) return;

  try {
    await connectDB();
    const pendingRequests = await RestockRequest.find({
      productId,
      size,
      status: "pending",
    });

    if (!pendingRequests || pendingRequests.length === 0) return;

    console.log(`[auto-restock] Found ${pendingRequests.length} pending requests for ${productName} (Size: ${size}).`);

    const url = `${getPublicSiteUrl()}/products/${productId}`; // Note: Ideally slug, but ID works if redirect is setup or if we fetch slug. We don't have slug here. Wait, let's fetch slug.
    const { Product } = await import("@/models/Product");
    const product = await Product.findById(productId).select("slug");
    const productUrl = `${getPublicSiteUrl()}/products/${product?.slug || productId}`;

    const html = emailLayout(
      "Good News: Back in Stock!",
      `
        <p>Hi there,</p>
        <p>You asked us to let you know when <strong>${productName}</strong> ${size ? `(Size: ${size})` : ''} was back in stock.</p>
        <p>Good news! It's available right now. Click the button below to grab yours before it sells out again.</p>
        <br/>
        <a href="${productUrl}" style="display:inline-block;padding:12px 24px;background-color:#000000;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:bold;">Shop Now</a>
      `,
      {}
    );

    for (const req of pendingRequests) {
      const emailResult = await sendEmail({
        to: req.email,
        subject: `Back in stock: ${productName}`,
        html,
      });

      if (emailResult.ok || emailResult.skipped) {
        req.status = "notified";
        await req.save();
      }
    }
    
    console.log(`[auto-restock] Successfully notified ${pendingRequests.length} customers.`);
  } catch (error) {
    console.error("[auto-restock] Error processing restock emails:", error);
  }
}
