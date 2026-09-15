with open("src/components/admin/AdminShell.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_link = '{ href: "/admin/analytics", label: "Insights", icon: FiBarChart2, roles: ["SUPERADMIN", "ADMIN", "MANAGER"] },'
new_link = '{ href: "/admin/analytics", label: "Insights", icon: FiBarChart2, roles: ["SUPERADMIN", "ADMIN", "MANAGER"] },\n  { href: "/admin/reports", label: "Reports", icon: FiBarChart2, roles: ["SUPERADMIN", "ADMIN", "MANAGER"] },'

content = content.replace(old_link, new_link)

with open("src/components/admin/AdminShell.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated AdminShell.tsx")
