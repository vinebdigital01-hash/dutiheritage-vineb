path = "src/app/products/[slug]/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

bad_str = """    if (!product) {
      const localKeywords = ["Delhi NCR", "Gurugram", "Manesar", "Haryana"];
  const autoKeywords = [
    product.name,
    `buy ${product.name} online`,
    ...localKeywords.map(loc => `${product.name} in ${loc}`),
    ...localKeywords.map(loc => `premium ${product.name.split(" ")[0] || "ethnic wear"} in ${loc}`),
    "Duti Heritage"
  ];

  return {
      title: "Product Not Found | Duti Heritage",
    };"""

good_str = """    if (!product) {
      return {
        title: "Product Not Found | Duti Heritage",
      };"""

content = content.replace(bad_str, good_str)
with open(path, "w", encoding="utf-8") as f:
    f.write(content)
