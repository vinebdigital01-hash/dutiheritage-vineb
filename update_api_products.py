for file in ["src/app/api/products/route.ts", "src/app/api/products/[id]/route.ts"]:
    with open(file, "r", encoding="utf-8") as f:
        content = f.read()

    # Look for assignment of properties
    # In route.ts (POST):
    old_post_fields = """      codAvailable: body.codAvailable,
      isPartialCOD: body.isPartialCOD,
      partialCODAdvance: Number(body.partialCODAdvance) || 0,
      isActive: body.isActive !== false,
    });"""
    new_post_fields = """      codAvailable: body.codAvailable,
      isPartialCOD: body.isPartialCOD,
      partialCODAdvance: Number(body.partialCODAdvance) || 0,
      inventory: body.inventory || [],
      trackInventory: Boolean(body.trackInventory),
      lowStockThreshold: Number(body.lowStockThreshold) || 3,
      stockStatus: body.stockStatus || "in_stock",
      isActive: body.isActive !== false,
    });"""
    content = content.replace(old_post_fields, new_post_fields)

    # In [id]/route.ts (PUT):
    old_put_fields = """    if (body.partialCODAdvance !== undefined) {
      product.partialCODAdvance = Number(body.partialCODAdvance) || 0;
    }
    if (body.isActive !== undefined) product.isActive = body.isActive;"""
    new_put_fields = """    if (body.partialCODAdvance !== undefined) {
      product.partialCODAdvance = Number(body.partialCODAdvance) || 0;
    }
    if (body.inventory !== undefined) product.inventory = body.inventory;
    if (body.trackInventory !== undefined) product.trackInventory = Boolean(body.trackInventory);
    if (body.lowStockThreshold !== undefined) product.lowStockThreshold = Number(body.lowStockThreshold) || 3;
    if (body.stockStatus !== undefined) product.stockStatus = body.stockStatus;
    if (body.isActive !== undefined) product.isActive = body.isActive;"""
    content = content.replace(old_put_fields, new_put_fields)

    with open(file, "w", encoding="utf-8") as f:
        f.write(content)
print("Updated API routes for Products")
