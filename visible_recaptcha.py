import os

path = 'src/app/account/page.tsx'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace("size: 'invisible',", "size: 'normal',")
# Also add some margin to the recaptcha-container so it looks good
code = code.replace('<div id="recaptcha-container"></div>', '<div id="recaptcha-container" className="mb-4 flex justify-center"></div>')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Changed to normal visible recaptcha.")
