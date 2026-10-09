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
    const product = await Product.findById(productId).select("slug image price salePrice");
    const productUrl = `${getPublicSiteUrl()}/products/${product?.slug || productId}`;
    const imageUrl = product?.image?.startsWith('http') ? product.image : `${getPublicSiteUrl()}${product?.image || ''}`;
    const priceDisplay = product?.salePrice ? `&#8377;${product.salePrice}` : `&#8377;${product?.price || ''}`;

    const html = emailLayout(
      "Good News: Back in Stock!",
      `
        <div style="text-align: center; font-family: sans-serif;">
          <h2 style="font-size: 22px; color: #111; margin-bottom: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">It's Back in Stock!</h2>
          <p style="font-size: 15px; color: #555; margin-bottom: 25px; line-height: 1.5;">
            You asked us to let you know when <strong>${productName}</strong> ${size ? `(Size: ${size})` : ''} was available again.<br/>
            Good news! We just restocked it.
          </p>
          
          <div style="background: #fafafa; border: 1px solid #eee; border-radius: 16px; padding: 20px; max-width: 400px; margin: 0 auto 30px auto;">
            ${imageUrl ? `<img src="${imageUrl}" alt="${productName}" style="width: 100%; max-width: 250px; border-radius: 12px; margin-bottom: 15px; object-fit: cover; aspect-ratio: 3/4;" />` : ''}
            <h3 style="font-size: 16px; color: #111; margin: 0 0 5px 0;">${productName}</h3>
            ${priceDisplay !== '&#8377;' ? `<p style="font-size: 14px; font-weight: bold; color: #222; margin: 0 0 15px 0;">${priceDisplay}</p>` : ''}
            
            <a href="${productUrl}" style="display:inline-block;padding:14px 32px;background-color:#000000;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; width: 100%; box-sizing: border-box;">Shop Now</a>
          </div>

          <div style="background: #fff8eb; border: 1px solid #ffe8c2; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0; color: #b45309; font-size: 13px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">🔥 High Demand Alert</p>
            <p style="margin: 5px 0 0 0; color: #d97706; font-size: 13px;">This item sold out quickly last time. Grab yours before it's gone again!</p>
          </div>
        </div>
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
