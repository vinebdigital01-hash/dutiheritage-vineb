path = "src/components/StoreShell.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'const isAdmin = pathname?.startsWith("/admin");\n\n  if (isAdmin) {\n    return <>{children}</>;\n  }',
    'const isStandalone = pathname?.startsWith("/admin") || pathname?.startsWith("/checkout");\n\n  if (isStandalone) {\n    return <>{children}</>;\n  }'
)

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
