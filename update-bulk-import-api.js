const fs = require('fs');
const file = 'src/app/api/products/bulk-import/route.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "codAvailable: typeof p.codAvailable === 'boolean' ? p.codAvailable : (p.codAvailable === 'true' || p.codAvailable === 'yes'),\n          isActive: typeof p.isActive === 'boolean' ? p.isActive : (p.isActive !== 'false' && p.isActive !== 'no'),",
  "codAvailable: typeof p.codAvailable === 'boolean' ? p.codAvailable : (p.codAvailable === 'true' || p.codAvailable === 'yes'),\n          isPartialCOD: typeof p.isPartialCOD === 'boolean' ? p.isPartialCOD : (p.isPartialCOD === 'true' || p.isPartialCOD === 'yes'),\n          partialCODAdvance: Number(p.partialCODAdvance) || 0,\n          isActive: typeof p.isActive === 'boolean' ? p.isActive : (p.isActive !== 'false' && p.isActive !== 'no'),"
);

fs.writeFileSync(file, content, 'utf8');
console.log('API updated');
