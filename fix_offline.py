path = "src/app/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

import_stmt = 'import { OfflineSync } from "@/components/OfflineSync/OfflineSync";\n'
if "OfflineSync" not in content:
    content = content.replace('import { PromoBanner }', import_stmt + 'import { PromoBanner }')

# We need to flatten the products
if "const allProducts =" not in content:
    content = content.replace(
        '  return (\n    <>',
        '  const allProducts = collectionsData.flatMap(d => d ? d.products : []);\n\n  return (\n    <>\n      <OfflineSync products={allProducts.slice(0, 50)} />'
    )

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
