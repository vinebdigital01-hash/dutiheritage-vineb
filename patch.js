const fs = require("fs");

let content = fs.readFileSync("src/components/admin/AdminShell.tsx", "utf8");
content = content.replace(
  /<div className="min-h-screen flex items-center justify-center bg-\[var\(--color-bg\)\]">\s*<p className="text-\[13px\] tracking-\[2px\] uppercase text-\[var\(--color-text-muted\)\] animate-pulse">\s*Verifying access…\s*<\/p>\s*<\/div>/,
  `<div className="min-h-screen p-8 bg-[var(--color-bg)]"><SkeletonTable /></div>`
);
if (!content.includes("SkeletonTable")) {
  console.log("Failed to patch AdminShell.tsx");
} else {
  content = `import { SkeletonTable } from "@/components/ui/Skeleton";\n` + content;
  fs.writeFileSync("src/components/admin/AdminShell.tsx", content, "utf8");
  console.log("Patched AdminShell.tsx");
}
