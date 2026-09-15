with open("src/lib/mappers.ts", "r", encoding="utf-8") as f:
    content = f.read()

old_mapper = """    partialCODAdvance: (doc.partialCODAdvance as number | undefined) ?? 0,
    isActive: doc.isActive !== false,
  };"""

new_mapper = """    partialCODAdvance: (doc.partialCODAdvance as number | undefined) ?? 0,
    isActive: doc.isActive !== false,
    inventory: (doc.inventory as Product["inventory"]) ?? undefined,
    trackInventory: Boolean(doc.trackInventory),
    lowStockThreshold: (doc.lowStockThreshold as number | undefined) ?? 3,
    stockStatus: (doc.stockStatus as Product["stockStatus"]) ?? "in_stock",
  };"""

content = content.replace(old_mapper, new_mapper)

with open("src/lib/mappers.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated toProduct mapper to include inventory fields")
