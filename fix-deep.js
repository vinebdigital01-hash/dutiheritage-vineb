const fs = require('fs');

// 1. Fix BulkImportClient.tsx template
const clientFile = 'src/app/admin/products/bulk-import/BulkImportClient.tsx';
let clientContent = fs.readFileSync(clientFile, 'utf8');

clientContent = clientContent.replace(
  'codAvailable: "true",\n          isActive: "true"',
  'codAvailable: "true",\n          isPartialCOD: "false",\n          partialCODAdvance: "0",\n          isActive: "true"'
);
fs.writeFileSync(clientFile, clientContent, 'utf8');


// 2. Fix api/products/bulk-import/route.ts
const apiFile = 'src/app/api/products/bulk-import/route.ts';
let apiContent = fs.readFileSync(apiFile, 'utf8');

// Fix colors splitting
apiContent = apiContent.replace(
  'colors: p.colors ? [p.colors] : [],',
  "colors: typeof p.colors === 'string' ? p.colors.split(',').map((s: string) => s.trim()).filter(Boolean) : (p.colors ? [p.colors] : []),"
);

// Add isPartialCOD and partialCODAdvance
apiContent = apiContent.replace(
  "codAvailable: typeof p.codAvailable === 'boolean' ? p.codAvailable : (p.codAvailable === 'true' || p.codAvailable === 'yes'),\n          isActive: typeof p.isActive === 'boolean' ? p.isActive : (p.isActive !== 'false' && p.isActive !== 'no'),",
  "codAvailable: typeof p.codAvailable === 'boolean' ? p.codAvailable : (p.codAvailable === 'true' || p.codAvailable === 'yes'),\n          isPartialCOD: typeof p.isPartialCOD === 'boolean' ? p.isPartialCOD : (p.isPartialCOD === 'true' || p.isPartialCOD === 'yes'),\n          partialCODAdvance: Number(p.partialCODAdvance) || 0,\n          isActive: typeof p.isActive === 'boolean' ? p.isActive : (p.isActive !== 'false' && p.isActive !== 'no'),"
);

fs.writeFileSync(apiFile, apiContent, 'utf8');
console.log('Fixes applied.');
