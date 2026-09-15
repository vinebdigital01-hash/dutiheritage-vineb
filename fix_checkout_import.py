path = "src/app/checkout/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('import { Product } from "@/types";\n', '')

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
