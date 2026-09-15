new_file = """import { Product } from "@/models";
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
    await Product.bulkWrite(operations);
  }
}
"""

with open("src/services/inventory.ts", "w", encoding="utf-8") as f:
    f.write(new_file)
print("Created inventory service")
