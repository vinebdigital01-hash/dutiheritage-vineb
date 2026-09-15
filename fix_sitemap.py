path = "src/app/sitemap.ts"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('return "http://localhost:3000";', 'return "https://www.dutiheritage.co.in";')

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
