import os
import glob

files = glob.glob("src/components/admin/charts/*.tsx")
for f in files:
    with open(f, "r", encoding="utf-8") as file:
        content = file.read()
    if not content.startswith('"use client";'):
        content = '"use client";\n' + content
        with open(f, "w", encoding="utf-8") as file:
            file.write(content)

print("Added 'use client' to all charts")
