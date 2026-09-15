import { Product } from "@/models";
import { connectDB } from "@/lib/mongodb";

export async function adjustInventory(items: { productId: string; size?: string; quantity: number }[], increment: boolean = false) {
  await connectDB();
  const operations = items.map(item => {
    const qtyChange = increment ? Math.abs(item.quantity) : -Math.abs(item.quantity);
    return {
      updateOne: {
        filter: { _id: item.productId, "inventory.size": item.size },
        update: { $inc: { "inventory.$.stock": qtyChange } }
      }
    };
  });
  
  if (operations.length > 0) {
    await Product.bulkWrite(operations as any);
    
    // Check for low stock alerts if decrementing
    if (!increment) {
      const productIds = items.map(i => i.productId);
      const updatedProducts = await Product.find({ _id: { $in: productIds } } as any).lean();
      
      const alerts: string[] = [];
      for (const item of items) {
        const p = updatedProducts.find(prod => prod._id.toString() === item.productId);
        if (p && p.trackInventory) {
          const invItem = p.inventory?.find(inv => inv.size === item.size);
          const threshold = p.lowStockThreshold || 3;
          // If current stock is exactly at or just below threshold, we alert.
          // Note: if it drops way below we also alert, but let's just alert if <= threshold.
          if (invItem && invItem.stock <= threshold) {
            alerts.push(`- ${p.name} (Size: ${invItem.size || 'Default'}) — Only ${invItem.stock} left!`);
          }
        }
      }
      
      if (alerts.length > 0) {
        const { sendEmail } = await import("@/lib/email");
        const emailTo = process.env.SUPER_ADMIN_EMAIL || "liveproject072@gmail.com";
        await sendEmail({
          to: emailTo,
          subject: "⚠️ Low Stock Alert - Duti Heritage",
          html: `<p>The following items are running low on stock:</p><ul>${alerts.map(a => `<li>${a}</li>`).join('')}</ul><p>Please log in to the admin panel to update inventory.</p>`,
          type: "orders"
        });
      }
    }
  }
}
