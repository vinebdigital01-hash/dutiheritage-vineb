import { requireAuth } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import { Order, Product, Customer } from "@/models";
import { handleApiError, jsonOk, requireMongo } from "@/lib/api";
import { escapeRegex } from "@/lib/order-workspace";
import { CATALOG_WRITE } from "@/lib/rbac";

export async function GET(request: Request) {
  try {
    requireMongo();
    const authUser = await requireAuth(request, { admin: true });
    await connectDB();

    const q = String(new URL(request.url).searchParams.get("q") || "").trim();
    if (q.length < 2) {
      return jsonOk({ orders: [], products: [], customers: [] });
    }

    const rx = new RegExp(escapeRegex(q), "i");
    const includeCatalog = Boolean(
      authUser.role && CATALOG_WRITE.includes(authUser.role)
    );

    const [orders, products, customers] = await Promise.all([
      Order.find({
        $or: [
          { orderId: rx },
          { "customer.phone": rx },
          { "customer.email": rx },
          { "customer.name": rx },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(8)
        .select("orderId status total customer createdAt")
        .lean(),
      includeCatalog
        ? Product.find({
            $or: [{ name: rx }, { slug: rx }, { "inventory.sku": rx }],
          })
            .sort({ updatedAt: -1 })
            .limit(8)
            .select("name slug price salePrice image")
            .lean()
        : Promise.resolve([]),
      Customer.find({
        $or: [{ name: rx }, { email: rx }, { phone: rx }],
      })
        .sort({ updatedAt: -1 })
        .limit(8)
        .select("name email phone totalOrders totalSpent")
        .lean(),
    ]);

    return jsonOk({
      orders: orders.map((o) => ({
        id: o._id.toString(),
        orderId: o.orderId,
        status: o.status,
        total: o.total,
        name: o.customer?.name || "",
        href: `/admin/orders/${o.orderId}`,
      })),
      products: products.map((p) => ({
        id: p._id.toString(),
        name: p.name,
        slug: p.slug,
        price: p.salePrice ?? p.price,
        href: `/admin/products/${p._id.toString()}/edit`,
      })),
      customers: customers.map((c) => ({
        id: c._id.toString(),
        name: c.name || c.email || c.phone || "Customer",
        email: c.email || "",
        phone: c.phone || "",
        href: `/admin/customers/${c._id.toString()}`,
      })),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
