path = ".env.local"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "WHATSAPP_BOT_API_URL=http://localhost:4000/api/notify",
    "WHATSAPP_BOT_API_URL=http://localhost:4000/internal/send-message"
)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
