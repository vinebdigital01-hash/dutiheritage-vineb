with open("src/components/admin/ProductForm.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# I want to add a small text at the bottom or top of the form
old_ui = """      <div className="flex justify-end gap-3 mt-8">
        <AdminButton
          type="button"
          variant="secondary"
          onClick={() => router.push("/admin/products")}
        >
          Cancel
        </AdminButton>"""

new_ui = """      {initialData?.lastEditedBy && (
        <div className="text-[12px] text-neutral-500 italic mt-6 pb-2 border-b border-neutral-100 flex items-center gap-2">
          <FiInfo size={14} />
          Last edited by <span className="font-medium text-neutral-700">{initialData.lastEditedBy}</span> 
          {initialData.updatedAt ? ` on ${new Date(initialData.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}` : ""}
        </div>
      )}

      <div className="flex justify-end gap-3 mt-8">
        <AdminButton
          type="button"
          variant="secondary"
          onClick={() => router.push("/admin/products")}
        >
          Cancel
        </AdminButton>"""

if "FiInfo" not in content:
    content = content.replace("FiX, FiPlus", "FiX, FiPlus, FiInfo")

content = content.replace(old_ui, new_ui)

with open("src/components/admin/ProductForm.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated ProductForm UI")
