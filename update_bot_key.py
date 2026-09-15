path = "src/app/api/auth/whatsapp/send/route.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('your_bot_secret_key', 'duti_bot_secret_key_2026')

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
