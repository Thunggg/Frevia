import { Skeleton } from "@repo/ui/components/shadcn/skeleton";

export default function FreelancerSavedSearchesLoading() {
  return (
    <div className="flex flex-1 flex-col bg-background font-sans min-h-0">
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-56 mb-2" />
          <Skeleton className="h-4 w-80" />
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
        {/* Controls skeleton */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-10 w-full sm:w-80 rounded-full" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-lg" />
          </div>
        </div>

        {/* Grid skeleton */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="flex min-h-56 flex-col rounded-xl border border-border bg-card p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <Skeleton className="size-10 rounded-lg" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-6 w-3/4 mb-3" />
              <div className="flex gap-1.5 mb-6">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-24 rounded-full" />
              </div>
              <div className="mt-auto space-y-2">
                <Skeleton className="h-9 w-full rounded-lg" />
                <Skeleton className="h-8 w-full rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
