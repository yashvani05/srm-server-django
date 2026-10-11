import { Skeleton } from '../ui/Skeleton';

export function AppShellSkeleton() {
  return (
    <div className="min-h-screen" role="status" aria-label="Loading application">
      <aside className="fixed inset-y-0 hidden w-60 border-r border-gray-200 bg-white p-5 lg:block">
        <Skeleton className="h-7 w-36" />
        <Skeleton className="mt-6 h-10 w-full" />
        <div className="mt-6 space-y-2">
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </aside>
      <div className="h-14 border-b border-gray-200 bg-white lg:hidden" />
      <main className="px-4 py-6 sm:px-6 sm:py-8 lg:pl-[calc(15rem+2rem)] lg:pr-8">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      </main>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
