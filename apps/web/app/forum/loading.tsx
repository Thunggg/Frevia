import { Skeleton } from "@repo/ui/components/shadcn/skeleton";

export default function ForumLoading() {
  return (
    <div className="min-h-dvh bg-background font-sans">
      <div className="h-14 border-b border-border bg-[#eaf8df] dark:bg-[#161716]" />

      <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-white/10 dark:bg-[#1a1c1a]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <Skeleton className="mb-4 h-4 w-28 bg-[#4fae2e]/15" />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-3">
              <Skeleton className="h-10 w-64 bg-[#4fae2e]/15" />
              <Skeleton className="h-4 w-96 max-w-full bg-[#4fae2e]/10" />
            </div>
            <Skeleton className="h-4 w-40 bg-[#4fae2e]/15" />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-10">
        <div className="lg:col-span-8">
          <Skeleton className="mb-4 h-7 w-36" />
          <div className="divide-y divide-border border-y border-border">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="flex flex-col gap-3 py-5 sm:flex-row sm:justify-between"
              >
                <div className="flex-1 space-y-3">
                  <Skeleton className="h-6 w-2/3" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                </div>
                <div className="space-y-2 sm:text-right">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-8 lg:col-span-4">
          <div className="space-y-4 rounded-xl border border-border p-5 sm:p-6">
            <Skeleton className="h-5 w-36" />
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 py-2">
                <Skeleton className="size-7 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4 rounded-xl border border-border p-5 sm:p-6">
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 py-2">
                <Skeleton className="size-8 rounded-full" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
