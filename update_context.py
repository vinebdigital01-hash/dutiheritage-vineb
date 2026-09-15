with open("src/context/AppContext.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace("isAdmin: boolean;", "isAdmin: boolean;\n  isFrozen: boolean;")
content = content.replace("const [isAdmin, setIsAdmin] = useState(false);", "const [isAdmin, setIsAdmin] = useState(false);\n  const [isFrozen, setIsFrozen] = useState(false);")
content = content.replace("adminRole: data.adminRole,", "adminRole: data.adminRole,\n          isFrozen: data.isFrozen,")
content = content.replace("setIsAdmin(data.isAdmin);", "setIsAdmin(data.isAdmin);\n            setIsFrozen(data.isFrozen || false);")
content = content.replace("setIsAdmin(false);", "setIsAdmin(false);\n        setIsFrozen(false);")
content = content.replace("adminRole,\n    authLoading,", "adminRole,\n    isFrozen,\n    authLoading,")

with open("src/context/AppContext.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated AppContext")
