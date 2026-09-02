const fs = require('fs');
let content = fs.readFileSync('src/app/admin/page.tsx', 'utf8');

const targetRegex = /\{loading \? \([\s\S]*?<p className="text-\[13px\] text-\[var\(--color-text-muted\)\] animate-pulse">[\s\S]*?Loading metrics\uFFFD?\uFFFD?\uFFFD?[\s\S]*?<\/p>[\s\S]*?\) \: \(/;

if (targetRegex.test(content)) {
  content = content.replace(
    targetRegex,
    '{loading ? (\n          <SkeletonAdminDashboard />\n        ) : ('
  );
  content = `import { SkeletonAdminDashboard } from "@/components/ui/Skeleton";\n` + content;
  fs.writeFileSync('src/app/admin/page.tsx', content, 'utf8');
  console.log("Patched admin/page.tsx successfully");
} else {
  // Let's try string replacement just in case regex failed
  console.log("Regex failed to find loading condition");
}
