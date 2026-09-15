path = "src/app/checkout/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'const res = await fetch(`/api/products/${productSlug}`);',
    'const res = await fetch(`/api/products?slug=${productSlug}`);'
)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
