import re

def add_metadata(path, metadata_code):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "export const metadata: Metadata" not in content:
        if "import { Metadata }" not in content and "import type { Metadata }" not in content:
            content = content.replace('import React', 'import { Metadata } from "next";\nimport React')
            if 'import { Metadata }' not in content:
                content = 'import { Metadata } from "next";\n' + content
        
        # Replace default export
        if "export default function" in content:
            content = content.replace("export default function", metadata_code + "\n\nexport default function")
        elif "export default async function" in content:
            content = content.replace("export default async function", metadata_code + "\n\nexport default async function")
            
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)

acc_meta = """export const metadata: Metadata = {
  title: "My Account | Duti Heritage",
  robots: { index: false, follow: false },
};"""
add_metadata("src/app/account/page.tsx", acc_meta)

chk_meta = """export const metadata: Metadata = {
  title: "Checkout | Duti Heritage",
  robots: { index: false, follow: false },
};"""
add_metadata("src/app/checkout/layout.tsx", chk_meta)
