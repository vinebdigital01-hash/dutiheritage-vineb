import { connectDB } from "@/lib/mongodb";
import { Customer, Order, Product } from "@/models";
import { validateBotApiKey } from "@/lib/bot-auth";
import { normalizeBotPhone, phoneMatchOr } from "@/lib/bot-phone";
import {
  handleApiError,
  jsonOk,
  requireMongo,
  ApiError,
} from "@/lib/api";

/**
 * POST /api/bot/negotiation/request
 * Body: { customerPhone, productId }
 * Returns a customer "story" for admin WhatsApp approval prompts.
 */
export async function POST(request: Request) {
  try {
    requireMongo();
    await validateBotApiKey(request);
    await connectDB();

    const body = await request.json();
    const customerPhone = normalizeBotPhone(String(body.customerPhone || body.phone || ""));
    const productId = String(body.productId || "").trim();
    if (!customerPhone || !productId) {
      throw new ApiError("customerPhone and productId are required");
    }

    const product = await Product.findById(productId).lean();
    if (!product) throw new ApiError("Product not found", 404);

    const customer = await Customer.findOne({
      $or: phoneMatchOr("phone", customerPhone),
    }).lean();

    const pastOrders = await Order.countDocuments({
      $or: [
        ...phoneMatchOr("customer.phone", customerPhone),
        ...(customer?._id ? [{ customerId: customer._id }] : []),
      ],
      status: { $nin: ["Cancelled"] },
    });

    const delivered = await Order.countDocuments({
      $or: [
        ...phoneMatchOr("customer.phone", customerPhone),
        ...(customer?._id ? [{ customerId: customer._id }] : []),
      ],
      status: "Delivered",
    });

    const totalSpent = customer?.totalSpent ?? 0;
    let story = "First time buyer";
    let segment: "new" | "returning" | "loyal" | "vip" = "new";

    if (pastOrders >= 1 && pastOrders < 3) {
      story = `Returning customer with ${pastOrders} past order${pastOrders === 1 ? "" : "s"}`;
      segment = "returning";
    } else if (pastOrders >= 3 && pastOrders <= 5) {
      story = `Loyal customer with ${pastOrders} past orders (₹${Math.round(totalSpent)} spent)`;
      segment = "loyal";
    } else if (pastOrders > 5 || delivered > 3) {
      story = `VIP customer with ${pastOrders} past orders and ${delivered} deliveries`;
      segment = "vip";
    }

    const price =
      product.salePrice && product.salePrice > 0 && product.salePrice < product.price
        ? Number(product.salePrice)
        : Number(product.price) || 0;

    return jsonOk({
      story,
      segment,
      customerPhone,
      customerName: customer?.name || "WhatsApp shopper",
      pastOrders,
      deliveredOrders: delivered,
      totalSpent,
      walletBalance: customer?.walletBalance ?? 0,
      product: {
        id: product._id.toString(),
        name: product.name,
        slug: product.slug,
        price,
      },
      adminPhones: ["918447746675", "919870487659", "918057195228"],
    });
  } catch (error) {
    return handleApiError(error);
  }
}
