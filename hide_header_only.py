path = "src/components/StoreShell.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    '<Header />',
    '{!pathname?.startsWith("/checkout") && <Header />}'
)
content = content.replace(
    '<AnnouncementBar />',
    '{!pathname?.startsWith("/checkout") && <AnnouncementBar />}'
)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
