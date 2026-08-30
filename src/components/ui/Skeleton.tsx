import React from 'react';

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-md bg-neutral-200 dark:bg-neutral-800 ${className}`}
      {...props}
    />
  );
}

export function SkeletonTable() {
  return (
    <div className="w-full space-y-3">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </div>
  );
}

export function SkeletonProductGrid({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="aspect-[3/4] w-full" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonCouponGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border-2 border-dashed border-[var(--color-border)] rounded-xl flex overflow-hidden bg-white">
          <div className="bg-gray-100 px-6 py-8 flex flex-col items-center justify-center border-r border-dashed border-[var(--color-border)] w-[120px] shrink-0">
            <Skeleton className="h-8 w-16 mb-2" />
            <Skeleton className="h-3 w-8" />
          </div>
          <div className="p-5 flex flex-col justify-center flex-1 space-y-3">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="mt-auto flex items-center justify-between bg-gray-50 border border-gray-200 rounded p-2">
              <Skeleton className="h-4 w-1/3 ml-2" />
              <Skeleton className="h-6 w-16 rounded" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonOrderList({ count = 3 }: { count?: number }) {
  return (
    <div className="flex flex-col gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="border border-[var(--color-border)] rounded-xl overflow-hidden bg-white shadow-sm">
          <div className="p-5 border-b border-[var(--color-border)] bg-gray-50 flex flex-wrap justify-between items-start gap-4">
            <div className="flex gap-8">
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="hidden sm:block space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="p-5 flex flex-col gap-5">
            <div className="flex gap-4">
              <Skeleton className="w-20 h-24 rounded-lg shrink-0" />
              <div className="flex-1 space-y-3 py-1">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-4 w-1/4 mt-2" />
              </div>
            </div>
          </div>
          <div className="p-5 border-t border-[var(--color-border)] bg-gray-50/50 flex flex-wrap gap-3 justify-end">
            <Skeleton className="h-10 w-32 rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="w-full h-[60vh] flex flex-col items-center justify-center space-y-4">
      <Skeleton className="h-8 w-[200px]" />
      <Skeleton className="h-4 w-[300px]" />
      <Skeleton className="h-4 w-[250px]" />
    </div>
  );
}

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
