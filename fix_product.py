path = "src/app/checkout/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

import_str = 'import type { CheckoutSettings } from "@/services/checkout";'
content = content.replace(import_str, 'import { Product } from "@/types";\n' + import_str)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
