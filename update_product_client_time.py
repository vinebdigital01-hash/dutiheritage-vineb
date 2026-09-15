with open("src/app/products/[slug]/ProductClient.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_date = """                          ? ` · ${new Date(r.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}`"""

new_date = """                          ? ` · ${new Date(r.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                              hour: "numeric",
                              minute: "2-digit"
                            })}`"""

content = content.replace(old_date, new_date)

with open("src/app/products/[slug]/ProductClient.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated ProductClient reviews to show time")
