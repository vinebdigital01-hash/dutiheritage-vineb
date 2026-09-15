with open("src/components/admin/ProductForm.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update FormState
old_state = """  partialCODAdvance: string;
  isActive: boolean;
  offers: OfferForm[];
};"""
new_state = """  partialCODAdvance: string;
  isActive: boolean;
  offers: OfferForm[];
  trackInventory: boolean;
  lowStockThreshold: string;
  inventory: { size: string; stock: string; sku: string }[];
};"""
content = content.replace(old_state, new_state)

# 2. Update emptyForm
old_empty = """  codAvailable: true,
  isPartialCOD: false,
  partialCODAdvance: "0",
  isActive: true,
  offers: [],
});"""
new_empty = """  codAvailable: true,
  isPartialCOD: false,
  partialCODAdvance: "0",
  isActive: true,
  offers: [],
  trackInventory: false,
  lowStockThreshold: "3",
  inventory: [],
});"""
content = content.replace(old_empty, new_empty)

# 3. Update useEffect (edit prepopulate)
old_prep = """    partialCODAdvance: String(p.partialCODAdvance || 0),
    isActive: p.isActive !== false,
    offers: (p.offers || []).map(o => ({
      title: o.title || "",
      description: o.description || "",
      code: o.code || "",
    })),"""
new_prep = """    partialCODAdvance: String(p.partialCODAdvance || 0),
    isActive: p.isActive !== false,
    offers: (p.offers || []).map(o => ({
      title: o.title || "",
      description: o.description || "",
      code: o.code || "",
    })),
    trackInventory: p.trackInventory || false,
    lowStockThreshold: String(p.lowStockThreshold ?? 3),
    inventory: (p.inventory || []).map(i => ({
      size: i.size || "",
      stock: String(i.stock || 0),
      sku: i.sku || "",
    })),"""
content = content.replace(old_prep, new_prep)

# 4. Update save
old_save = """        partialCODAdvance: Number(form.partialCODAdvance) || 0,
        isActive: form.isActive,
        offers: form.offers.filter(o => o.title && o.description),"""
new_save = """        partialCODAdvance: Number(form.partialCODAdvance) || 0,
        isActive: form.isActive,
        offers: form.offers.filter(o => o.title && o.description),
        trackInventory: form.trackInventory,
        lowStockThreshold: Number(form.lowStockThreshold) || 3,
        inventory: form.inventory.map(i => ({
          size: i.size,
          stock: Number(i.stock) || 0,
          sku: i.sku || "",
        })),"""
content = content.replace(old_save, new_save)

with open("src/components/admin/ProductForm.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated ProductForm state")
