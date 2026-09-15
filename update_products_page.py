with open("src/app/admin/products/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

old_actions = """        actions={
          <div className="flex flex-wrap gap-2">
            <AdminButton variant="secondary" onClick={handleExportCSV}>Export CSV</AdminButton>
              <Link href="/admin/products/bulk-import">
              <AdminButton variant="secondary">Bulk Import</AdminButton>
            </Link>
            <Link href="/admin/products/bulk-offers">
              <AdminButton variant="secondary">Bulk Offers</AdminButton>
            </Link>"""

new_actions = """        actions={
          <div className="flex flex-wrap gap-2">
            <AdminButton variant="secondary" onClick={handleExportCSV}>Export CSV</AdminButton>
            <Link href="/admin/products/bulk-inventory">
              <AdminButton variant="secondary">Bulk Inventory</AdminButton>
            </Link>
            <Link href="/admin/products/bulk-import">
              <AdminButton variant="secondary">Bulk Import</AdminButton>
            </Link>
            <Link href="/admin/products/bulk-offers">
              <AdminButton variant="secondary">Bulk Offers</AdminButton>
            </Link>"""

content = content.replace(old_actions, new_actions)

with open("src/app/admin/products/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated Products page with bulk inventory link")
