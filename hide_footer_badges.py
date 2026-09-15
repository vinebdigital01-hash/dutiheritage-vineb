path = "src/components/Footer/Footer.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

import_stmt = 'import { usePathname } from "next/navigation";\n'
if "usePathname" not in content:
    content = content.replace('import Link from "next/link";', 'import Link from "next/link";\n' + import_stmt)

# Add pathname hook
if "const pathname = usePathname();" not in content:
    content = content.replace(
        'const content = useSiteContent();',
        'const pathname = usePathname();\n  const isCheckout = pathname?.startsWith("/checkout");\n  const content = useSiteContent();'
    )

# Hide TrustBadges on checkout
content = content.replace('<TrustBadges />', '{!isCheckout && <TrustBadges />}')

# Give the footer a white background so it doesn't look weird overlapping the gray split screen
content = content.replace('<footer className="w-full">', '<footer className="w-full bg-white relative z-50">')

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
