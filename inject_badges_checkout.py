path = "src/app/checkout/page.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

import_stmt = 'import { TrustBadges } from "@/components/TrustBadges";\n'
if "TrustBadges" not in content:
    content = content.replace('import Link from "next/link";', 'import Link from "next/link";\n' + import_stmt)
    
    old_footer = '{/* Footer Links */}'
    new_footer = '<div className="mt-8 border-t border-[var(--color-border)] pt-8">\n              <TrustBadges className="border-none py-0 grid-cols-2 lg:grid-cols-4 gap-y-6" />\n            </div>\n\n            {/* Footer Links */}'
    content = content.replace(old_footer, new_footer)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
