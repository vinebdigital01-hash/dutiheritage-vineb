path = "src/app/api/auth/whatsapp/send/route.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('http://localhost:3001/api/notify', 'http://localhost:4000/api/notify')

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
