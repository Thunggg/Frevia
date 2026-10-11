import { Skeleton } from "@repo/ui/components/shadcn/skeleton";

export default function JobDetailLoading() {
  return (
    <div className="min-h-dvh bg-background font-sans">
      <div className="h-14 border-b border-border bg-[#eaf8df] dark:bg-[#161716]" />

      <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-white/10 dark:bg-[#1a1c1a]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Skeleton className="h-4 w-56 bg-[#4fae2e]/15" />
            <Skeleton className="h-4 w-28 bg-[#4fae2e]/15" />
          </div>

          <div className="mt-6 flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0 max-w-3xl flex-1 space-y-4">
              <Skeleton className="h-6 w-24 rounded-full bg-[#4fae2e]/20" />
              <Skeleton className="h-10 w-full max-w-xl bg-[#4fae2e]/15" />
              <Skeleton className="h-10 w-48 bg-[#4fae2e]/25" />
              <Skeleton className="h-4 w-40 bg-[#4fae2e]/15" />
              <div className="flex gap-4 pt-1">
                <Skeleton className="h-4 w-32 bg-[#4fae2e]/15" />
                <Skeleton className="h-4 w-36 bg-[#4fae2e]/15" />
              </div>
            </div>

            <div className="hidden gap-2 lg:flex">
              <Skeleton className="size-11 rounded-md bg-[#4fae2e]/15" />
              <Skeleton className="h-11 w-32 rounded-md bg-[#4fae2e]/25" />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-12">
        <div className="space-y-10 lg:col-span-8">
          <section className="space-y-4">
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-full max-w-prose" />
            <Skeleton className="h-4 w-full max-w-prose" />
            <Skeleton className="h-4 w-5/6 max-w-prose" />
            <Skeleton className="h-4 w-4/5 max-w-prose" />
            <Skeleton className="h-4 w-full max-w-prose" />
            <Skeleton className="h-4 w-3/4 max-w-prose" />
          </section>

          <section className="space-y-4 border-t border-border pt-10">
            <Skeleton className="h-7 w-40" />
            <div className="flex flex-wrap gap-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-8 w-20 rounded-full"
                />
              ))}
            </div>
          </section>

          <section className="space-y-4 border-t border-border pt-10">
            <div className="flex items-end justify-between gap-3">
              <div className="space-y-2">
                <Skeleton className="h-7 w-44" />
                <Skeleton className="h-4 w-52" />
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
            <div className="divide-y divide-border border-y border-border">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between gap-4 py-4"
                >
                  <Skeleton className="h-5 w-2/3" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="lg:col-span-4">
          <div className="space-y-5 rounded-xl border border-border p-5 sm:p-6">
            <div className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-8 w-40" />
            </div>

            <div className="divide-y divide-border border-y border-border">
              {Array.from({ length: 5 }).map((_, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3"
                >
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                </div>
              ))}
            </div>

            <div className="space-y-3 border-t border-border pt-4">
              <Skeleton className="h-4 w-14" />
              <div className="flex items-center gap-3">
                <Skeleton className="size-11 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-11 w-full rounded-md" />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
