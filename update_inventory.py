with open("src/services/inventory.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_func = """  if (operations.length > 0) {
    await Product.bulkWrite(operations as any);
  }
}"""

new_func = """  if (operations.length > 0) {
    await Product.bulkWrite(operations as any);
    
    // Check for low stock alerts if decrementing
    if (!increment) {
      const productIds = items.map(i => i.productId);
      const updatedProducts = await Product.find({ _id: { $in: productIds } }).lean();
      
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
}"""

content = content.replace(old_func, new_func)

with open("src/services/inventory.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Added low stock email alerts")
