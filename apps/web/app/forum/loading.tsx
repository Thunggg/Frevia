import { Skeleton } from "@repo/ui/components/shadcn/skeleton";

export default function ForumLoading() {
  return (
    <div className="min-h-dvh bg-background font-sans">
      <div className="h-14 border-b border-border bg-[#eaf8df] dark:bg-[#161716]" />

      <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-white/10 dark:bg-[#1a1c1a]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-14">
          <Skeleton className="mb-4 h-4 w-28 bg-[#4fae2e]/15" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-64 bg-[#4fae2e]/15" />
            <Skeleton className="h-4 w-96 max-w-full bg-[#4fae2e]/10" />
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-10">
        <div className="lg:col-span-8">
          <div className="divide-y divide-border border-y border-border">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-start gap-4 px-1 py-5 sm:items-center sm:py-6">
                <Skeleton className="size-10 shrink-0 rounded-full bg-[#4fae2e]/15" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48 bg-muted" />
                  <Skeleton className="h-4 w-full bg-muted" />
                  <Skeleton className="h-4 w-3/4 bg-muted" />
                </div>
                <div className="shrink-0 space-y-1.5 sm:text-right">
                  <Skeleton className="h-4 w-12 bg-muted" />
                  <Skeleton className="h-3 w-10 bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <aside className="space-y-6 lg:col-span-4">
          <div className="rounded-xl border border-border p-5 sm:p-6">
            <Skeleton className="h-5 w-28 bg-muted" />
            <div className="mt-4 divide-y divide-border">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between py-3">
                  <Skeleton className="h-4 w-3/4 bg-muted" />
                  <Skeleton className="h-3 w-16 bg-muted" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border p-5 sm:p-6">
            <Skeleton className="h-5 w-36 bg-muted" />
            <div className="mt-4 space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="size-10 shrink-0 rounded-full bg-muted" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-1/2 bg-muted" />
                    <Skeleton className="h-3 w-28 bg-muted" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
