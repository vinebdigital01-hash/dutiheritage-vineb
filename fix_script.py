path = "src/app/layout.tsx"
with open(path, "r", encoding="utf-8") as f:
    content = f.read()

script_tag = '        <script\n          type="application/ld+json"\n          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessJsonLd) }}\n        />\n'

if "JSON.stringify(localBusinessJsonLd)" not in content:
    content = content.replace(
        '<body>\n',
        '<body>\n' + script_tag
    )

with open(path, "w", encoding="utf-8") as f:
    f.write(content)
