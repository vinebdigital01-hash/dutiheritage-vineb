with open("src/app/admin/reviews/page.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Update form state
content = content.replace(
    'const [form, setForm] = useState({\n    productId: "",\n    userName: "",\n    rating: 5,\n    comment: "",\n  });',
    'const [form, setForm] = useState({\n    productId: "",\n    userName: "",\n    rating: 5,\n    comment: "",\n    createdAt: "",\n  });'
)

# 2. Update setForm resets
content = content.replace(
    'setForm({ productId: products[0]?.id || "", userName: "", rating: 5, comment: "" });',
    'setForm({ productId: products[0]?.id || "", userName: "", rating: 5, comment: "", createdAt: "" });'
)

# 3. Update downloadTemplate
content = content.replace(
    'comment: "Amazing product! highly recommended."\n      }));',
    'comment: "Amazing product! highly recommended.",\n        date: "2026-08-15"\n      }));'
)

# 4. Update the Bulk Upload instructions text
content = content.replace(
    'The CSV must include: <code>productId</code>, <code>userName</code>, <code>rating</code> (1-5), and <code>comment</code>',
    'The CSV must include: <code>productId</code>, <code>userName</code>, <code>rating</code> (1-5), <code>comment</code>, and optional <code>date</code>'
)

# 5. Add the Date Input to the Modal
old_textarea = """              <AdminTextarea
                label="Review Comment"
                placeholder="Write the review here..."
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                required
              />"""

new_textarea_and_date = """              <AdminTextarea
                label="Review Comment"
                placeholder="Write the review here..."
                value={form.comment}
                onChange={(e) => setForm({ ...form, comment: e.target.value })}
                required
              />

              <AdminInput
                type="datetime-local"
                label="Review Date (Optional)"
                value={form.createdAt}
                onChange={(e) => setForm({ ...form, createdAt: e.target.value })}
                placeholder="Leave empty for current time"
              />"""
              
content = content.replace(old_textarea, new_textarea_and_date)

with open("src/app/admin/reviews/page.tsx", "w", encoding="utf-8") as f:
    f.write(content)
print("Updated Admin Reviews Page")
