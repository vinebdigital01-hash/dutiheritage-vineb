with open("src/lib/api.ts", "r", encoding="utf-8") as f:
    content = f.read()

import re
# find any string containing "Duplicate key"
content = re.sub(r'\"Duplicate key.*\"', '"Duplicate key: record already exists"', content)

with open("src/lib/api.ts", "w", encoding="utf-8") as f:
    f.write(content)
print("Cleaned up duplicate key message in api.ts")
