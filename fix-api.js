const fs = require('fs');

const apiFile = 'src/app/api/products/bulk-import/route.ts';
let apiContent = fs.readFileSync(apiFile, 'utf8');

// Use regex to match the lines and inject between them
const regex = /codAvailable:[^\n]+,\s*isActive:[^\n]+,/;
const replacement = `codAvailable: typeof p.codAvailable === 'boolean' ? p.codAvailable : (p.codAvailable === 'true' || p.codAvailable === 'yes'),
          isPartialCOD: typeof p.isPartialCOD === 'boolean' ? p.isPartialCOD : (p.isPartialCOD === 'true' || p.isPartialCOD === 'yes'),
          partialCODAdvance: Number(p.partialCODAdvance) || 0,
          isActive: typeof p.isActive === 'boolean' ? p.isActive : (p.isActive !== 'false' && p.isActive !== 'no'),`;

apiContent = apiContent.replace(regex, replacement);

fs.writeFileSync(apiFile, apiContent, 'utf8');
console.log('Regex replace executed on API file.');
