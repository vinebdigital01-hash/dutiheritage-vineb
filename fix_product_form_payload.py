with open("src/components/admin/ProductForm.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_payload = """          isActive: form.isActive,
          offers: (form.offers || []).filter(o => o.title.trim() && o.description.trim()),
        };"""

new_payload = """          isActive: form.isActive,
          offers: (form.offers || []).filter(o => o.title.trim() && o.description.trim()),
          trackInventory: form.trackInventory,
          inventory: form.inventory.map(i => ({ size: i.size.trim(), stock: Number(i.stock) || 0, sku: i.sku.trim() })),
        };"""

content = content.replace(old_payload, new_payload)

with open("src/components/admin/ProductForm.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated ProductForm payload to include inventory fields")
