with open("src/app/api/analytics/dashboard/route.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('import mongoose from "mongoose";\n    const abandonedCollections', 'const abandonedCollections')

with open("src/app/api/analytics/dashboard/route.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Cleaned up")
