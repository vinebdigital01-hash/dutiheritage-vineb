with open("src/context/AppContext.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("setIsAdmin(synced.isAdmin);", "setIsAdmin(synced.isAdmin);\n        setIsFrozen(synced.isFrozen || false);")

with open("src/context/AppContext.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated AppContext setIsFrozen")
