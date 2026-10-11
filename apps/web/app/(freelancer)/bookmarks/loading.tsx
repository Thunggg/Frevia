import { Skeleton } from "@repo/ui/components/shadcn/skeleton";

export default function BookmarksLoading() {
  return (
    <div className="min-h-dvh bg-background font-sans">
      <div className="h-14 border-b border-border bg-[#eaf8df] dark:bg-[#12331f]" />

      <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-[#4fae2e]/25 dark:bg-[#12331f]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <Skeleton className="mb-4 h-4 w-28 bg-[#4fae2e]/15" />
          <Skeleton className="h-10 w-52 bg-[#4fae2e]/15" />
          <Skeleton className="mt-3 h-4 w-80 max-w-full bg-[#4fae2e]/10" />
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="divide-y divide-border border-y border-border">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col gap-4 px-3 py-6 sm:flex-row sm:justify-between sm:px-5 sm:py-7"
            >
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <div className="flex gap-2 sm:flex-col">
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-8 w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
