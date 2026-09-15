path = "src/app/checkout/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'const product = await res.json();\n            addToCart(product, size);',
    'const data = await res.json();\n            if (data?.product) { addToCart(data.product, size); }'
)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
