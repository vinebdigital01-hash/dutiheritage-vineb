const fs = require('fs');
const file = 'src/app/admin/products/bulk-import/BulkImportClient.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'codAvailable: "true",\n          isActive: "true"',
  'codAvailable: "true",\n          isPartialCOD: "false",\n          partialCODAdvance: "0",\n          isActive: "true"'
);

fs.writeFileSync(file, content, 'utf8');
console.log('BulkImportClient updated');
