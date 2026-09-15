path = "src/app/api/bot/chat/flag/route.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("@/lib/db", "@/lib/mongodb")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
