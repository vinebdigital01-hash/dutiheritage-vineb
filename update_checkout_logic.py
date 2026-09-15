with open("src/services/checkout.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_logic = """  return lines.map((line) => {
    const product = byId.get(line.productId);
    if (!product) {
      throw new ApiError(`Product not found or inactive: ${line.productId}`, 400);
    }
    const qty = Math.max(1, Number(line.quantity) || 1);
    return {"""

new_logic = """  return lines.map((line) => {
    const product = byId.get(line.productId);
    if (!product) {
      throw new ApiError(`Product not found or inactive: ${line.productId}`, 400);
    }
    const qty = Math.max(1, Number(line.quantity) || 1);
    
    // Validate Inventory
    if (product.trackInventory && product.inventory) {
      const inv = product.inventory.find(i => i.size === line.size);
      if (!inv || inv.stock < qty) {
        throw new ApiError(
          `Only ${inv ? inv.stock : 0} left for ${product.name} (Size: ${line.size || 'Default'})`, 
          400
        );
      }
    }

    return {"""

content = content.replace(old_logic, new_logic)

with open("src/services/checkout.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated priceCartLines inventory validation")
