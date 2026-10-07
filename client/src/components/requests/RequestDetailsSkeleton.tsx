import { Card } from '../ui/Card';
import { Skeleton } from '../ui/Skeleton';

export function RequestDetailsSkeleton() {
  return (
    <div role="status" aria-label="Loading request details">
      <Skeleton className="mb-4 h-4 w-24" />
      <div className="mb-6 space-y-3">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-14" />
        </div>
        <Skeleton className="h-7 w-2/3" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="p-5">
            <Skeleton className="h-7 w-full" />
          </Card>
          <Card className="space-y-2 p-5">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-2/3" />
          </Card>
        </div>
        <Card className="space-y-4 p-5">
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="flex justify-between">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </Card>
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
