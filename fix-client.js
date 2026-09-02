const fs = require('fs');

let content = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

// Strip out existing "use client" strings
content = content.replace(/["']use client["'];?\s*/g, '');

// Re-add to absolute top
content = '"use client";\n' + content;

fs.writeFileSync('src/app/admin/page.tsx', content, 'utf8');
console.log("Fixed 'use client' directive location in admin/page.tsx");
