with open("src/types/index.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "seoDescription?: string;\n}",
    "seoDescription?: string;\n  discountBanner?: string;\n}"
)

with open("src/types/index.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated Collection type")
