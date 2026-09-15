with open("src/lib/mappers.ts", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    "isPartialCOD: doc.isPartialCOD,",
    "isPartialCOD: doc.isPartialCOD,\n    lastEditedBy: doc.lastEditedBy,\n    updatedAt: doc.updatedAt ? new Date(doc.updatedAt).toISOString() : undefined,"
)

with open("src/lib/mappers.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated mappers for Product")
