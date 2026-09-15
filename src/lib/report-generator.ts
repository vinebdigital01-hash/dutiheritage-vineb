import { connectDB } from "@/lib/mongodb";
import { Order, Product, Cart, Customer } from "@/models";
import { sendEmail } from "@/lib/email";

function toCSV(data: any[], headers: string[]) {
  if (data.length === 0) return headers.join(",") + "\n";
  const rows = data.map(row => 
    headers.map(h => {
      const val = row[h];
      if (val === null || val === undefined) return "";
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    }).join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export async function generateMonthlyReport(targetEmail: string) {
  await connectDB();
  const endDate = new Date();
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 1); // Last 30 days or last month

  // 1. Orders Data
  const orders = await Order.find({ createdAt: { $gte: startDate, $lt: endDate } }).lean();
  
  let totalRevenue = 0;
  let totalOrders = 0;
  let cod = 0;
  let prepaid = 0;
  let cancelled = 0;

  const orderRows = orders.map(o => {
    if (o.status !== "Cancelled" && o.status !== "Returned") {
      totalRevenue += o.total || 0;
      totalOrders++;
      if (o.paymentMethod === "cod") cod++;
      else prepaid++;
    } else {
      cancelled++;
    }
    return {
      OrderId: o.orderId,
      Date: new Date(o.createdAt).toISOString().split("T")[0],
      Customer: o.customer?.name || "",
      Email: o.customer?.email || "",
      Total: o.total,
      Status: o.status,
      PaymentMethod: o.paymentMethod
    };
  });

  const orderCsv = toCSV(orderRows, ["OrderId", "Date", "Customer", "Email", "Total", "Status", "PaymentMethod"]);

  // 2. Inventory Alerts
  const products = await Product.find({ trackInventory: true }).lean();
  const inventoryRows: any[] = [];
  products.forEach(p => {
    if (!p.inventory) return;
    p.inventory.forEach(inv => {
      if (inv.stock <= (p.lowStockThreshold || 3)) {
        inventoryRows.push({
          ProductName: p.name,
          Size: inv.size || "Default",
          Stock: inv.stock,
          Status: inv.stock === 0 ? "Out of Stock" : "Low Stock"
        });
      }
    });
  });

  const inventoryCsv = toCSV(inventoryRows, ["ProductName", "Size", "Stock", "Status"]);

  // 3. Customer Growth
  const newCustomers = await Customer.countDocuments({ createdAt: { $gte: startDate, $lt: endDate } });

  // 4. Abandoned Carts
  const abandonedCartsCount = await Cart.countDocuments({ status: "abandoned", lastUpdated: { $gte: startDate, $lt: endDate } });

  // HTML Email Body
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #000;">Duti Heritage - Monthly Report</h2>
      <p>Here is the automated store performance report for the last 30 days (${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}).</p>
      
      <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
        <h3 style="margin-top:0;">Summary Metrics</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Revenue:</strong></td><td style="text-align: right; border-bottom: 1px solid #eee;">₹${totalRevenue.toLocaleString()}</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Total Orders:</strong></td><td style="text-align: right; border-bottom: 1px solid #eee;">${totalOrders}</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Prepaid vs COD:</strong></td><td style="text-align: right; border-bottom: 1px solid #eee;">${prepaid} Prepaid / ${cod} COD</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>Cancelled:</strong></td><td style="text-align: right; border-bottom: 1px solid #eee;">${cancelled}</td></tr>
          <tr><td style="padding: 8px 0; border-bottom: 1px solid #eee;"><strong>New Customers:</strong></td><td style="text-align: right; border-bottom: 1px solid #eee;">${newCustomers}</td></tr>
          <tr><td style="padding: 8px 0;"><strong>Abandoned Carts:</strong></td><td style="text-align: right;">${abandonedCartsCount}</td></tr>
        </table>
      </div>

      <p>Please find the detailed CSV reports attached.</p>
    </div>
  `;

  // Base64 encode for Resend attachments
  const b64Orders = Buffer.from(orderCsv).toString("base64");
  const b64Inventory = Buffer.from(inventoryCsv).toString("base64");

  const res = await sendEmail({
    to: targetEmail,
    subject: `Monthly Store Report - ${endDate.toLocaleString('default', { month: 'long', year: 'numeric' })}`,
    html,
    attachments: [
      { filename: "monthly_orders.csv", content: b64Orders },
      { filename: "inventory_alerts.csv", content: b64Inventory }
    ]
  });

  return res;
}
