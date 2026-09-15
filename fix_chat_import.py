path = "src/app/api/bot/chat/flag/route.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("import ChatSession from '@/models/ChatSession';", "import { ChatSession } from '@/models';")

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
