with open("src/components/admin/CollectionForm.tsx", "r", encoding="utf-8") as f:
    content = f.read()

content = content.replace(
    'seoDescription: initialData?.seoDescription || "",',
    'seoDescription: initialData?.seoDescription || "",\n    discountBanner: initialData?.discountBanner || "",'
)

old_ui = """      </div>

      <div className="flex justify-end gap-3 mt-8">"""

new_ui = """      </div>

      <div className="bg-white border border-neutral-200 rounded-xl p-6 shadow-sm space-y-6">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-[1px] mb-1">Marketing</h3>
          <p className="text-[13px] text-neutral-500 mb-4">Add a promotional banner to this collection page.</p>
          <AdminInput
            label="Discount Banner Text (Optional)"
            placeholder="e.g. Buy 2, Get 15% Off — Use Code BUNDLE15"
            value={form.discountBanner}
            onChange={(e) => setForm({ ...form, discountBanner: e.target.value })}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8">"""

content = content.replace(old_ui, new_ui)

with open("src/components/admin/CollectionForm.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated CollectionForm UI")
