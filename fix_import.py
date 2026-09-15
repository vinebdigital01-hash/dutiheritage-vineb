with open("src/app/api/analytics/dashboard/route.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('import mongoose from "mongoose";\\n    const abandonedCollections', 'const abandonedCollections')
content = 'import mongoose from "mongoose";\n' + content

with open("src/app/api/analytics/dashboard/route.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed mongoose import")
