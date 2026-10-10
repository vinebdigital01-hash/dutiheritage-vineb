import os
import re

path = 'src/app/account/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

# Add the icon just before the PhoneInput tag
if '<FaWhatsapp' not in code:
    code = code.replace(
        '<PhoneInput',
        '<div className="flex items-center"><FaWhatsapp className="text-[#25D366] text-xl mr-3 shrink-0" /><PhoneInput'
    )
    # the PhoneInput closes with '/>' and style prop. Let's make sure we close the div after PhoneInput.
    # Actually, we can just replace the parent div. Let's use a regex!
    code = re.sub(
        r'<div className="w-full border border-\[var\(--color-border\)\] px-4 py-3 text-\[14px\] outline-none \s*focus-within:border-black transition-colors bg-transparent">\s*<div className="flex items-center"><FaWhatsapp[^>]+><PhoneInput([\s\S]*?)/>\s*</div>',
        r'<div className="w-full flex items-center border border-[var(--color-border)] px-4 py-3 text-[14px] outline-none focus-within:border-black transition-colors bg-transparent">\n                    <FaWhatsapp className="text-[#25D366] text-xl mr-3 shrink-0" />\n                    <PhoneInput\g<1}/>\n                  </div>',
        code
    )

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Icon added.")
