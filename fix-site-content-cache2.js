const fs = require('fs');
const file = 'src/app/api/site-content/route.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  'return jsonOk({',
  'revalidatePath("/", "layout");\n    return jsonOk({'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed cache invalidation');
