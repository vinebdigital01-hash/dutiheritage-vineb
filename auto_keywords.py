path = "src/app/products/[slug]/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

keywords_code = """  const localKeywords = ["Delhi NCR", "Gurugram", "Manesar", "Haryana"];
  const autoKeywords = [
    product.name,
    `buy ${product.name} online`,
    ...localKeywords.map(loc => `${product.name} in ${loc}`),
    ...localKeywords.map(loc => `premium ${product.name.split(" ")[0] || "ethnic wear"} in ${loc}`),
    "Duti Heritage"
  ];

  return {"""

content = content.replace("  return {", keywords_code)
content = content.replace(
    'alternates: {\n      canonical: `${baseUrl}/products/${slug}`,\n    },',
    'keywords: autoKeywords,\n    alternates: {\n      canonical: `${baseUrl}/products/${slug}`,\n    },'
)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
