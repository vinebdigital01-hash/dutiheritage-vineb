with open("src/lib/mappers.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "seoDescription: doc.seoDescription,",
    "seoDescription: doc.seoDescription,\n    discountBanner: doc.discountBanner,"
)

with open("src/lib/mappers.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated Collection mappers")
