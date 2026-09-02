const fs = require('fs');
const file = 'src/app/admin/products/page.tsx';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('handleExportCSV')) {
  const exportStr = `
  const handleExportCSV = () => {
    if (!products || products.length === 0) {
      show("No products to export", "error");
      return;
    }
    const headers = [
      "id", "name", "slug", "price", "salePrice", "description", 
      "collectionId", "image", "images", "sizes", "colors", "tags", 
      "seoTitle", "seoDescription", "boughtLast7Days", "videoUrls", 
      "codAvailable", "isActive"
    ];
    const rows = products.map(p => {
      const escapeStr = (str) => {
        if (!str) return "";
        return '"' + String(str).replace(/"/g, '""') + '"';
      };
      return [
        p.id,
        escapeStr(p.name),
        p.slug,
        p.price,
        p.salePrice || "",
        escapeStr(p.description),
        p.collectionId,
        p.image || "",
        escapeStr((p.images || []).join(",")),
        escapeStr((p.sizes || []).join(",")),
        escapeStr((p.colors || []).join(",")),
        escapeStr((p.tags || []).join(",")),
        escapeStr(p.seoTitle),
        escapeStr(p.seoDescription),
        p.boughtLast7Days || 0,
        escapeStr((p.videoUrls || []).join(",")),
        p.codAvailable !== false ? "true" : "false",
        p.isActive !== false ? "true" : "false"
      ].join(",");
    });
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows].join("\\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "products_export_" + new Date().toISOString().split('T')[0] + ".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    show("Exported successfully!", "success");
  };
`;

  content = content.replace(
    /const load = async \(\) => {/,
    exportStr + '\n  const load = async () => {'
  );

  content = content.replace(
    /<Link href="\/admin\/products\/bulk-import">/,
    '<AdminButton variant="secondary" onClick={handleExportCSV}>Export CSV</AdminButton>\n              <Link href="/admin/products/bulk-import">'
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log('Added CSV export');
}
