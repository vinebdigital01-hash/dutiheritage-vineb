import { connectDB } from "@/lib/mongodb";
import { Customer } from "@/models";
import { requireAuth } from "@/lib/auth";
import { handleApiError, requireMongo } from "@/lib/api";
import { buildCustomerListFilter } from "@/lib/customers";
import { toCsv } from "@/lib/csv";

export async function GET(request: Request) {
  try {
    requireMongo();
    await requireAuth(request, { admin: true });
    await connectDB();

    const { searchParams } = new URL(request.url);
    const filter = buildCustomerListFilter(searchParams);
    const docs = await Customer.find(filter)
      .sort({ lastVisit: -1, createdAt: -1 })
      .limit(5000)
      .lean();

    const csv = toCsv(
      [
        "name",
        "email",
        "phone",
        "city",
        "state",
        "pincode",
        "orders",
        "spent",
        "ltv",
        "codOrders",
        "frozen",
        "codBlocked",
        "source",
        "lastVisit",
      ],
      docs.map((c) => [
        c.name,
        c.email,
        c.phone,
        c.city,
        c.state,
        c.pincode,
        c.totalOrders || 0,
        c.totalSpent || 0,
        c.ltvScore,
        c.codOrderCount || 0,
        c.frozen ? "yes" : "no",
        c.codBlocked ? "yes" : "no",
        c.source,
        c.lastVisit ? new Date(c.lastVisit).toISOString() : "",
      ])
    );

    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="customers-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
