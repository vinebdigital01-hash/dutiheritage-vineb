const fs = require('fs');
const file = 'src/app/api/site-content/route.ts';
let content = fs.readFileSync(file, 'utf8');

// Undo accidental change in GET if it happened
content = content.replace(
  'revalidatePath("/", "layout");\n    return jsonOk({',
  'return jsonOk({'
);

// Add properly in PUT
content = content.replace(
  /const doc = await SiteContent\.findOneAndUpdate\([^;]+;/g,
  (match) => match + '\n    revalidatePath("/", "layout");'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed cache invalidation correctly');
