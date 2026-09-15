path = "src/components/StoreShell.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

# Revert the change
content = content.replace(
    'const isStandalone = pathname?.startsWith("/admin") || pathname?.startsWith("/checkout");\n\n  if (isStandalone) {\n    return <>{children}</>;\n  }',
    'const isAdmin = pathname?.startsWith("/admin");\n\n  if (isAdmin) {\n    return <>{children}</>;\n  }'
)

# However, the user might want Header hidden on checkout, but Footer shown. 
# "mujhe footer bhi chaiyeeeeeeeeeeeee" implies they specifically missed the footer.
# If I just revert to exactly what it was, Header and Footer will both show.
with open(path, "w", encoding="utf-8") as f:
    f.write(content)
