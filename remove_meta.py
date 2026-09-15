import re

def remove_metadata(path):
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Remove the metadata export block
    content = re.sub(r'export const metadata: Metadata = \{\n.*?robots: \{ index: false, follow: false \},\n\};\n\n', '', content, flags=re.DOTALL)
    
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

remove_metadata("src/app/account/page.tsx")
