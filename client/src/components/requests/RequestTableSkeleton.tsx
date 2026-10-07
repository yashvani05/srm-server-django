import { Skeleton } from '../ui/Skeleton';

export function RequestTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading service requests">
      <div className="hidden md:block">
        <div className="flex gap-4 border-b border-gray-200 bg-gray-50 px-4 py-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-3 w-16" />
          ))}
        </div>
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="flex items-center gap-4 border-b border-gray-100 px-4 py-4">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="ml-auto h-4 w-20" />
          </div>
        ))}
      </div>
      <div className="divide-y divide-gray-100 md:hidden">
        {Array.from({ length: Math.min(rows, 4) }, (_, i) => (
          <div key={i} className="space-y-3 p-4">
            <Skeleton className="h-4 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-3 w-1/3" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
