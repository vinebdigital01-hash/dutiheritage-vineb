const fs = require('fs');
const pageFile = 'src/app/admin/products/page.tsx';
let pageContent = fs.readFileSync(pageFile, 'utf8');

pageContent = pageContent.replace(
  /<td className="px-4 py-3">\s*<div className="flex items-center gap-3 min-w-\[220px\]">/g,
  '<td className="px-4 py-3 w-10">\n                        <input type="checkbox" className="accent-black w-4 h-4 cursor-pointer" checked={selectedIds.has(p.id)} onChange={() => toggleOne(p.id)} />\n                      </td>\n                      <td className="px-4 py-3">\n                        <div className="flex items-center gap-3 min-w-[220px]">'
);

fs.writeFileSync(pageFile, pageContent, 'utf8');
console.log('Fixed checkbox rendering in body');
