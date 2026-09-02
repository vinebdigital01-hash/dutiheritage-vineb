const fs = require('fs');
let skeleton = fs.readFileSync('src/components/ui/Skeleton.tsx', 'utf8');

const newSkeleton = `
export function SkeletonAdminDashboard() {
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white border border-[var(--color-border)] rounded-lg p-5 flex flex-col space-y-3">
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="h-6 w-1/3" />
            {i === 7 && <Skeleton className="h-3 w-2/3" />}
          </div>
        ))}
      </div>
      <div className="border border-[var(--color-border)] rounded-lg bg-white overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-16" />
        </div>
        <div className="p-5 space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex justify-between items-center py-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/6" />
              <Skeleton className="h-6 w-1/6 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
`;

if (!skeleton.includes("SkeletonAdminDashboard")) {
  skeleton += newSkeleton;
  fs.writeFileSync('src/components/ui/Skeleton.tsx', skeleton, 'utf8');
  console.log("Added SkeletonAdminDashboard");
}
