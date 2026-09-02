const fs = require('fs');
const file = 'src/app/api/products/[id]/route.ts';
let content = fs.readFileSync(file, 'utf8');

// Fix PUT cache invalidation
content = content.replace(
  'revalidatePath(/products/);',
  'revalidatePath("/", "layout");'
);
content = content.replace(
  'revalidatePath(/);',
  ''
);

// Fix DELETE cache invalidation
content = content.replace(
  'await refreshCollectionProductCount(collectionId);',
  'await refreshCollectionProductCount(collectionId);\n    revalidatePath("/", "layout");'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed API cache paths');
