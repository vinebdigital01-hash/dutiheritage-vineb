const fs = require('fs');

let adminShell = fs.readFileSync('src/components/admin/AdminShell.tsx', 'utf8');
adminShell = adminShell.replace(/<div className="min-h-screen p-8 bg-\[var\(--color-bg\)\]"><SkeletonTable \/><\/div>/g, '<div className="min-h-screen p-8"><SkeletonPage /></div>');
adminShell = adminShell.replace(/import \{ SkeletonTable \}/g, 'import { SkeletonPage }');
fs.writeFileSync('src/components/admin/AdminShell.tsx', adminShell, 'utf8');

let productForm = fs.readFileSync('src/components/admin/ProductForm.tsx', 'utf8');
productForm = productForm.replace(/<SkeletonTable \/>/g, '<SkeletonPage />');
productForm = productForm.replace(/import \{ SkeletonTable \}/g, 'import { SkeletonPage }');
fs.writeFileSync('src/components/admin/ProductForm.tsx', productForm, 'utf8');

console.log("Fixed Admin Skeletons");
