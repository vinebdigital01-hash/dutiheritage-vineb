import os

path = 'src/app/api/auth/whatsapp/send/route.ts'
with open(path, 'r', encoding='utf-8') as f:
    code = f.read()

code = code.replace('dY"?', '🔐')

with open(path, 'w', encoding='utf-8') as f:
    f.write(code)

print("Emoji fixed.")
