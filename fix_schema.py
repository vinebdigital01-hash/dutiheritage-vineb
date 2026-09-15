path = "src/app/collections/[slug]/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

old_json = """                "itemListElement": displayProducts.map((p, index) => ({
                  "@type": "ListItem",
                  "position": index + 1,
                  "item": {
                    "@type": "Product",
                    "name": p.name,
                    "url": `${baseUrl}/products/${p.slug}`
                  }
                }))"""

new_json = """                "itemListElement": displayProducts.map((p, index) => ({
                  "@type": "ListItem",
                  "position": index + 1,
                  "item": {
                    "@type": "Product",
                    "name": p.name,
                    "url": `${baseUrl}/products/${p.slug}`,
                    "image": p.image ? (p.image.startsWith('http') ? p.image : `${baseUrl}${p.image}`) : undefined,
                    "offers": {
                      "@type": "Offer",
                      "priceCurrency": "INR",
                      "price": p.salePrice || p.price,
                      "itemCondition": "https://schema.org/NewCondition",
                      "availability": "https://schema.org/InStock",
                      "url": `${baseUrl}/products/${p.slug}`
                    }
                  }
                }))"""

if old_json in content:
    content = content.replace(old_json, new_json)
else:
    print("Could not find old_json")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
