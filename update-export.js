const fs = require('fs');
const file = 'src/app/admin/products/page.tsx';
let content = fs.readFileSync(file, 'utf8');

// Update headers
content = content.replace(
  '"codAvailable", "isActive"',
  '"codAvailable", "isPartialCOD", "partialCODAdvance", "isActive"'
);

// Update rows map
content = content.replace(
  'p.codAvailable !== false ? "true" : "false",\n          p.isActive !== false ? "true" : "false"',
  'p.codAvailable !== false ? "true" : "false",\n          p.isPartialCOD ? "true" : "false",\n          p.partialCODAdvance || 0,\n          p.isActive !== false ? "true" : "false"'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Export updated');
