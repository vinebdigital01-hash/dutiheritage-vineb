const fs = require('fs');
const file = 'src/app/api/products/[id]/route.ts';
let content = fs.readFileSync(file, 'utf8');

if (!content.includes('revalidatePath }')) {
    content = 'import { revalidatePath } from "next/cache";\n' + content;
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed import');
}
