# Fix for Product.ts
with open("src/models/Product.ts", "r", encoding="utf-8") as f:
    content = f.read()
content = content.replace("ProductSchema.index({ slug: 1 }, { unique: true });\n", "")
with open("src/models/Product.ts", "w", encoding="utf-8") as f:
    f.write(content)

# Fix for Collection.ts
with open("src/models/Collection.ts", "r", encoding="utf-8") as f:
    content = f.read()
content = content.replace("CollectionSchema.index({ slug: 1 }, { unique: true });\n", "")
with open("src/models/Collection.ts", "w", encoding="utf-8") as f:
    f.write(content)
