with open("src/components/admin/ProductForm.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_empty = """const emptyForm = (): FormState => ({
  name: "",
  slug: "",
  price: "",
  salePrice: "",
  description: "",
  collectionId: "",
  image: "",
  images: "",
  sizes: ["S", "M", "L", "XL"],
  colors: "",
  tags: [],
  seoTitle: "",
  seoDescription: "",
  boughtLast7Days: "0",
  videoUrls: "",
  codAvailable: true,
    isPartialCOD: false,
    partialCODAdvance: "0",
    isActive: true,
  offers: [],
});"""

new_empty = """const emptyForm = (): FormState => ({
  name: "",
  slug: "",
  price: "",
  salePrice: "",
  description: "",
  collectionId: "",
  image: "",
  images: "",
  sizes: ["S", "M", "L", "XL"],
  colors: "",
  tags: [],
  seoTitle: "",
  seoDescription: "",
  boughtLast7Days: "0",
  videoUrls: "",
  codAvailable: true,
    isPartialCOD: false,
    partialCODAdvance: "0",
    isActive: true,
  offers: [],
  trackInventory: false,
  lowStockThreshold: "3",
  inventory: []
});"""

content = content.replace(old_empty, new_empty)

with open("src/components/admin/ProductForm.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed emptyForm properly")
