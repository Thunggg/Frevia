import { Skeleton } from "@repo/ui/components/shadcn/skeleton";

export default function FreelancerBookmarksLoading() {
  return (
    <div className="flex flex-1 flex-col bg-background font-sans min-h-0">
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-72" />
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
        {/* Controls skeleton */}
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Skeleton className="h-10 w-full sm:w-80 rounded-full" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-36 rounded-full" />
            <Skeleton className="h-10 w-28 rounded-full" />
          </div>
        </div>

        {/* List skeleton */}
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="rounded-[28px] border border-border bg-card p-5 sm:p-6"
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-20 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
                <Skeleton className="size-9 rounded-full" />
              </div>
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/3 mb-4" />
              <div className="flex justify-between items-center pt-2">
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

