with open("src/components/admin/ProductForm.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_mapper = """    offers:
      p.offers?.map((o) => ({
        type: o.type,
        label: o.label,
        discountValue: String(o.discountValue),
        isPercentage: o.isPercentage,
      })) || [],
  };"""

new_mapper = """    offers:
      p.offers?.map((o) => ({
        type: o.type,
        label: o.label,
        discountValue: String(o.discountValue),
        isPercentage: o.isPercentage,
      })) || [],
    trackInventory: p.trackInventory || false,
    lowStockThreshold: String(p.lowStockThreshold || 3),
    inventory: (p.inventory || []).map(i => ({ size: i.size || "", stock: String(i.stock), sku: i.sku || "" }))
  };"""

content = content.replace(old_mapper, new_mapper)

with open("src/components/admin/ProductForm.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed productToForm")
