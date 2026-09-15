with open("src/components/admin/ProductForm.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace Name block
old_name = """          <AdminInput
            label="Name *"
            required
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              setForm((prev) => ({
                ...prev,
                name,
                slug: prev.slug && isEdit ? prev.slug : slugify(name),
              }));
            }}
          />"""

new_name = """          <div>
            <AdminInput
              label="Name *"
              required
              value={form.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((prev) => ({
                  ...prev,
                  name,
                  slug: prev.slug && isEdit ? prev.slug : slugify(name),
                }));
              }}
              maxLength={80}
            />
            <CharCounter current={form.name.length} max={80} recommended={60} />
          </div>"""
content = content.replace(old_name, new_name)

# Replace Description block
old_desc = """        <AdminTextarea
          label="Description"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />"""

new_desc = """        <div>
          <AdminTextarea
            label="Description"
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            maxLength={5000}
          />
          <CharCounter current={form.description.length} max={5000} />
        </div>"""
content = content.replace(old_desc, new_desc)

# Replace SEO block
old_seo = """        <section className="grid md:grid-cols-2 gap-5">
          <AdminInput
            label="SEO title"
            value={form.seoTitle}
            onChange={(e) => set("seoTitle", e.target.value)}
          />
          <AdminTextarea
            label={`SEO description (${form.seoDescription.length} chars)`}
            value={form.seoDescription}
            onChange={(e) => set("seoDescription", e.target.value)}
            maxLength={200}
          />
        </section>"""

new_seo = """        <section className="grid md:grid-cols-2 gap-5">
          <div>
            <AdminInput
              label="SEO title"
              value={form.seoTitle}
              onChange={(e) => set("seoTitle", e.target.value)}
              maxLength={70}
            />
            <CharCounter current={form.seoTitle.length} max={70} recommended={60} />
          </div>
          <div>
            <AdminTextarea
              label="SEO description"
              value={form.seoDescription}
              onChange={(e) => set("seoDescription", e.target.value)}
              maxLength={200}
            />
            <CharCounter current={form.seoDescription.length} max={200} recommended={160} />
          </div>
          <GooglePreview 
            title={form.seoTitle || form.name} 
            description={form.seoDescription || form.description} 
            slug={form.slug} 
          />
        </section>"""
content = content.replace(old_seo, new_seo)

with open("src/components/admin/ProductForm.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated ProductForm.tsx")
