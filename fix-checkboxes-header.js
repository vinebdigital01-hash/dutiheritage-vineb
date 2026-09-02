const fs = require('fs');
const pageFile = 'src/app/admin/products/page.tsx';
let pageContent = fs.readFileSync(pageFile, 'utf8');

pageContent = pageContent.replace(
  '<input type="checkbox" className="accent-black" checked={filtered.length > 0 && selectedIds.size === filtered.length} onChange={toggleAll} />',
  '<input type="checkbox" className="accent-black w-4 h-4 cursor-pointer" checked={filtered.length > 0 && selectedIds.size === filtered.length} onChange={toggleAll} />'
);

fs.writeFileSync(pageFile, pageContent, 'utf8');
console.log('Fixed header checkbox classes');
