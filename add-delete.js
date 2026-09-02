const fs = require('fs');
const file = 'src/components/admin/ProductForm.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add isDeleting state
content = content.replace(
  'const [saving, setSaving] = useState(false);',
  'const [saving, setSaving] = useState(false);\n  const [isDeleting, setIsDeleting] = useState(false);'
);

// 2. Add handleDelete function
const deleteFunc = `
  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product? This action cannot be undone.")) return;
    setIsDeleting(true);
    try {
      await adminFetch(\`/api/products/\${productId}?hard=1\`, { method: "DELETE" });
      show("Product deleted", "success");
      router.push("/admin/products");
      router.refresh();
    } catch(e) {
      show(e instanceof Error ? e.message : "Failed to delete", "error");
      setIsDeleting(false);
    }
  };
`;

content = content.replace(
  /const handleSubmit = async \(e: React\.FormEvent\) => \{/,
  deleteFunc + '\n  const handleSubmit = async (e: React.FormEvent) => {'
);

// 3. Add Delete Button in UI
content = content.replace(
  '<AdminButton type="button" variant="ghost">\n              Cancel\n            </AdminButton>\n          </Link>\n        </div>',
  '<AdminButton type="button" variant="ghost">\n              Cancel\n            </AdminButton>\n          </Link>\n          {isEdit && (\n            <button type="button" onClick={handleDelete} disabled={isDeleting} className="ml-auto px-4 py-2 text-[13px] font-bold tracking-[1px] uppercase text-red-600 hover:bg-red-50 rounded-lg transition-colors">\n              {isDeleting ? "Deleting..." : "Delete Product"}\n            </button>\n          )}\n        </div>'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Added Delete button');
