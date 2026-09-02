const fs = require('fs');
const file1 = 'src/app/api/products/[id]/route.ts';
let content1 = fs.readFileSync(file1, 'utf8');

if (!content1.includes('revalidatePath')) {
    content1 = content1.replace(
        /import { NextResponse } from "next\/server";/,
        'import { NextResponse } from "next/server";\nimport { revalidatePath } from "next/cache";'
    );
    content1 = content1.replace(
        /await existing\.save\(\);/,
        'await existing.save();\n    revalidatePath(`/products/${existing.slug}`);\n    revalidatePath(`/`);'
    );
    fs.writeFileSync(file1, content1, 'utf8');
    console.log('Updated [id]/route.ts');
}
