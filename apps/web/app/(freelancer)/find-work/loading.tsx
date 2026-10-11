import { Skeleton } from "@repo/ui/components/shadcn/skeleton";

export default function FindWorkLoading() {
  return (
    <div className="min-h-dvh bg-background font-sans">
      <div className="h-14 border-b border-border bg-[#eaf8df] dark:bg-[#12331f]" />

      <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-[#4fae2e]/25 dark:bg-[#12331f]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <Skeleton className="mb-4 h-4 w-28 bg-[#4fae2e]/15" />
          <Skeleton className="h-10 w-48 bg-[#4fae2e]/15" />
          <Skeleton className="mt-3 h-4 w-96 max-w-full bg-[#4fae2e]/10" />
        </div>
      </section>

      <div className="border-b border-border">
        <div className="mx-auto flex max-w-7xl gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <Skeleton className="h-11 w-full max-w-xs" />
          <Skeleton className="hidden h-11 w-40 lg:block" />
          <Skeleton className="hidden h-11 w-40 lg:block" />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="mb-4 h-4 w-40" />
        <div className="divide-y divide-border border-y border-border">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="space-y-3 px-3 py-6 sm:px-5 sm:py-7">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
              <div className="flex gap-2 pt-1">
                <Skeleton className="h-6 w-16 rounded-full" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
