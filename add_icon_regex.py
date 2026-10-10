import os
import re

path = 'src/app/account/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Make the container flex and add FaWhatsapp
code = re.sub(
    r'<div className="w-full border border-\[var\(--color-border\)\] px-4 py-3 text-\[14px\] outline-none \s*focus-within:border-black transition-colors bg-transparent">\s*<PhoneInput',
    r'<div className="w-full flex items-center border border-[var(--color-border)] px-4 py-3 text-[14px] outline-none focus-within:border-black transition-colors bg-transparent">\n                    <FaWhatsapp className="text-[#25D366] text-xl mr-3 shrink-0" />\n                    <PhoneInput',
    code
)

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Icon added finally.")
