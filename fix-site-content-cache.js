const fs = require('fs');
const file = 'src/app/api/site-content/route.ts';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('revalidatePath')) {
  // Add import
  content = 'import { revalidatePath } from "next/cache";\n' + content;

  // Add invalidation in PUT
  content = content.replace(
    'return jsonOk({ success: true });',
    'revalidatePath("/", "layout");\n    return jsonOk({ success: true });'
  );

  fs.writeFileSync(file, content, 'utf8');
  console.log('Added revalidatePath to site-content');
}
