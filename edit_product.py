path = "src/app/products/[slug]/ProductClient.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

import_stmt = 'import { TrustBadges } from "@/components/TrustBadges";\n'
if "TrustBadges" not in content:
    content = content.replace('import Link from "next/link";', 'import Link from "next/link";\n' + import_stmt)
    
    # We will place it below the add to cart / buy now buttons block
    # In ProductClient, there's a div wrapping the actions. We can find `<div className="mt-8 flex flex-col gap-4">` or similar.
    # Actually, a safe place is right above the Product Description accordion.
    
    # Let's find: {/* Product Description Accordion */}
    old_acc = '{/* Product Description Accordion */}'
    new_acc = '<div className="mt-8 mb-4 border-t border-gray-200"><TrustBadges className="border-none py-6 grid-cols-2 md:grid-cols-4" /></div>\n              {/* Product Description Accordion */}'
    content = content.replace(old_acc, new_acc)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
