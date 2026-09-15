path = "src/components/Footer/Footer.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

import_stmt = 'import { TrustBadges } from "@/components/TrustBadges";\n'
if "TrustBadges" not in content:
    content = content.replace('import Link from "next/link";', 'import Link from "next/link";\n' + import_stmt)

    old_return = '<footer className="w-full pt-16 pb-8 px-4 border-t border-[var(--color-border)]">'
    new_return = '<footer className="w-full">\n        <div className="max-w-[1440px] mx-auto px-4"><TrustBadges /></div>\n        <div className="w-full pt-16 pb-8 px-4 border-t border-[var(--color-border)]">'
    
    content = content.replace(old_return, new_return)
    content = content.replace('</footer>', '</div></footer>')

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
