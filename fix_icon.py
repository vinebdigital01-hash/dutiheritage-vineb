with open("src/components/admin/AdminShell.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace('{ href: "/admin/reports", label: "Reports", icon: FiBarChart2', '{ href: "/admin/reports", label: "Reports", icon: FiFileText')
if "FiFileText" not in content[:500]:
    content = content.replace("FiBarChart2,", "FiBarChart2, FiFileText,")

with open("src/components/admin/AdminShell.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Fixed icon")
