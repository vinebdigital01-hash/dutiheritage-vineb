const fs = require('fs');
const pageFile = 'src/app/admin/products/page.tsx';
let pageContent = fs.readFileSync(pageFile, 'utf8');

// Replace the start of the block
pageContent = pageContent.replace(
  /\) : \(\s+\{selectedIds\.size > 0 && \(/g,
  ') : (\n        <>\n          {selectedIds.size > 0 && ('
);

// Replace the end of the block
pageContent = pageContent.replace(
  /<\/table>\s+<\/div>\s+<\/div>\s+\)}/g,
  '</table>\n            </div>\n          </div>\n        </>\n        )}'
);

fs.writeFileSync(pageFile, pageContent, 'utf8');
console.log('Fixed JSX syntax robustly');
