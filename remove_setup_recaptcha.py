import os
import re

path = 'src/app/account/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

code = re.sub(r'\s*setupRecaptcha\(\);', '', code)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("setupRecaptcha removed.")
