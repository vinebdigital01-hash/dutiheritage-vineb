import re

def add_metadata(path, metadata_code):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    if "export const metadata: Metadata" not in content:
        # Add import if missing
        if "import { Metadata }" not in content and "import type { Metadata }" not in content:
            content = content.replace('import React', 'import { Metadata } from "next";\nimport React')
            if 'import { Metadata }' not in content:
                content = 'import { Metadata } from "next";\n' + content
        
        # Insert metadata before default export
        content = content.replace("export default function", metadata_code + "\n\nexport default function")
        
        with open(path, 'w', encoding='utf-8') as f:
            f.write(content)

ret_meta = """export const metadata: Metadata = {
  title: "Exchange Policy | Duti Heritage",
  description: "Exchange policy for Duti Heritage. No returns accepted. Size exchange and defective product exchange available within 24 hours of delivery.",
};"""
add_metadata("src/app/return-exchange/page.tsx", ret_meta)

ship_meta = """export const metadata: Metadata = {
  title: "Delivery & Shipping Policy | Duti Heritage",
  description: "Free shipping on prepaid orders. Pan India delivery in 3-7 working days. COD available with partial advance. Dispatch within 48-72 hours.",
};"""
add_metadata("src/app/shipping/page.tsx", ship_meta)
