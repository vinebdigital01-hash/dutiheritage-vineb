import { connectDB } from "@/lib/mongodb";
import { OfflineClaim, Product, Customer, Order } from "@/models";
import { validateBotApiKey } from "@/lib/bot-auth";
import { normalizeBotPhone, phoneMatchOr } from "@/lib/bot-phone";
import { generateOrderId, handleApiError, jsonOk, requireMongo, ApiError } from "@/lib/api";

const LOYALTY = 100;

/**
 * POST /api/bot/offline-claims/claim
 * Body: { claimId, phone }
 */
export async function POST(request: Request) {
  try {
    requireMongo();
    await validateBotApiKey(request);
    await connectDB();

    const body = await request.json();
    const claimId = String(body.claimId || "")
      .trim()
      .toUpperCase()
      .replace(/^CLAIM-ORDER-/, "");
    const phoneRaw = String(body.phone || "").trim();
    if (!claimId || !phoneRaw) {
      throw new ApiError("claimId and phone are required");
    }

    const phone = normalizeBotPhone(phoneRaw);
    const claim = await OfflineClaim.findOne({ claimId });
    if (!claim) throw new ApiError("Claim not found", 404);
    if (claim.isClaimed) {
      throw new ApiError("This claim was already used", 400);
    }

    const product = await Product.findById(claim.productId).lean();
    if (!product) throw new ApiError("Product no longer available", 404);

    let customer = await Customer.findOne({ $or: phoneMatchOr("phone", phone) });
    if (!customer) {
      customer = await Customer.create({
        phone,
        name: "Offline Customer",
        source: "manual",
        walletBalance: 0,
      });
    }

    const unitPrice =
      claim.price > 0
        ? claim.price
        : product.salePrice && product.salePrice < product.price
          ? Number(product.salePrice)
          : Number(product.price) || 0;

    const orderId = generateOrderId();
    const now = new Date();

    const order = await Order.create({
      orderId,
      customerId: customer._id,
      customer: {
        name: customer.name || "Offline Customer",
        email: customer.email || "",
        phone,
        address: "Offline Store Purchase",
        city: "Offline",
        state: "Offline",
        pinCode: "000000",
        country: "IN",
      },
      items: [
        {
          productId: product._id.toString(),
          slug: product.slug,
          name: product.name,
          image: product.image || "",
          size: claim.size,
          quantity: 1,
          price: unitPrice,
          salePrice: product.salePrice || undefined,
          hsn: product.hsn || undefined,
          gstRate: product.gstRate || undefined,
        },
      ],
      subtotal: unitPrice,
      discount: 0,
      shipping: 0,
      total: unitPrice,
      paymentMethod: "prepaid",
      paymentStatus: "paid",
      status: "Delivered",
      tags: ["offline", "whatsapp-claim"],
      timeline: [
        {
          at: now,
          actor: "bot",
          action: "placed",
          toStatus: "Delivered",
          message: "Offline purchase",
          internal: false,
        },
      ],
    } as Record<string, unknown>);

    claim.isClaimed = true;
    claim.claimedByPhone = phone;
    claim.orderId = orderId;
    await claim.save();

    customer.walletBalance = Number(customer.walletBalance || 0) + LOYALTY;
    customer.totalOrders = Number(customer.totalOrders || 0) + 1;
    customer.totalSpent = Number(customer.totalSpent || 0) + unitPrice;
    customer.lastPurchase = now;
    customer.phone = phone;
    await customer.save();

    return jsonOk({
      success: true,
      orderId,
      claimId: claim.claimId,
      loyaltyEarned: LOYALTY,
      walletBalance: customer.walletBalance,
      productName: product.name,
      size: claim.size,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
