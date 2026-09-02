const fs = require('fs');

// Fix 1: Wrap JSX in fragment in page.tsx
const pageFile = 'src/app/admin/products/page.tsx';
let pageContent = fs.readFileSync(pageFile, 'utf8');

pageContent = pageContent.replace(
  ') : (\n          {selectedIds.size > 0 && (',
  ') : (\n        <>\n          {selectedIds.size > 0 && ('
);

pageContent = pageContent.replace(
  '             </table>\n            </div>\n          </div>',
  '             </table>\n            </div>\n          </div>\n        </>'
);

fs.writeFileSync(pageFile, pageContent, 'utf8');

// Fix 2: Import Product in api/products/bulk-update/route.ts
const apiFile = 'src/app/api/products/bulk-update/route.ts';
let apiContent = fs.readFileSync(apiFile, 'utf8');
apiContent = apiContent.replace("import { ProductModel } from '@/models/Product';", "import { Product } from '@/models';");
apiContent = apiContent.replace(/ProductModel\./g, "Product.");

fs.writeFileSync(apiFile, apiContent, 'utf8');
console.log("Fixed JSX syntax and Model imports");
