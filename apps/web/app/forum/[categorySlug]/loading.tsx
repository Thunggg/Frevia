import { Skeleton } from "@repo/ui/components/shadcn/skeleton";

export default function ForumCategoryLoading() {
  return (
    <div className="min-h-dvh bg-background font-sans">
      <div className="h-14 border-b border-border bg-[#eaf8df] dark:bg-[#161716]" />

      <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-white/10 dark:bg-[#1a1c1a]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <Skeleton className="mb-5 h-4 w-56 bg-[#4fae2e]/15" />
          <Skeleton className="h-10 w-72 max-w-full bg-[#4fae2e]/15" />
          <Skeleton className="mt-3 h-4 w-96 max-w-full bg-[#4fae2e]/10" />
          <Skeleton className="mt-3 h-4 w-24 bg-[#4fae2e]/10" />
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <Skeleton className="h-11 w-full max-w-md rounded-lg" />
          <div className="flex gap-2">
            <Skeleton className="h-11 w-28 rounded-lg" />
            <Skeleton className="h-11 w-28 rounded-lg" />
            <Skeleton className="h-11 w-[120px] rounded-lg" />
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          <aside className="order-2 lg:order-1 lg:col-span-4">
            <div className="space-y-4 rounded-xl border border-border p-5 sm:p-6">
              <Skeleton className="h-5 w-40" />
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-start gap-3 py-2">
                  <Skeleton className="size-7 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </aside>

          <div className="order-1 lg:order-2 lg:col-span-8">
            <Skeleton className="mb-4 h-4 w-48" />
            <div className="divide-y divide-border border-y border-border">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="space-y-3 px-3 py-6 sm:px-5 sm:py-7">
                  <Skeleton className="h-6 w-3/5" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />
                  <div className="flex items-center gap-3 pt-1">
                    <Skeleton className="size-8 rounded-full" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
