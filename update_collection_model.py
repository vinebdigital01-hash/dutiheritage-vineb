with open("src/models/Collection.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "seoDescription: { type: String, trim: true },",
    "seoDescription: { type: String, trim: true },\n    discountBanner: { type: String, trim: true },"
)

with open("src/models/Collection.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated Collection model")
