import { Skeleton } from "@repo/ui/components/shadcn/skeleton";

export default function PostDetailLoading() {
  return (
    <div className="min-h-dvh bg-background font-sans">
      <div className="h-14 border-b border-border bg-[#eaf8df] dark:bg-[#12331f]" />

      <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-[#4fae2e]/25 dark:bg-[#12331f]">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <Skeleton className="mb-4 h-4 w-72 max-w-full bg-[#4fae2e]/15" />
          <Skeleton className="h-4 w-40 bg-[#4fae2e]/10" />
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <Skeleton className="h-9 w-3/4" />

        <div className="mt-5 flex items-center gap-3">
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>

        <div className="mt-8 space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>

        <div className="mt-8 flex items-center gap-3 border-y border-border py-3">
          <Skeleton className="h-8 w-16 rounded-md" />
          <Skeleton className="h-8 w-14 rounded-md" />
        </div>

        <div className="mt-10 space-y-4">
          <Skeleton className="h-6 w-28" />
          <Skeleton className="h-28 w-full rounded-xl" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="flex gap-3 border-t border-border py-5">
              <Skeleton className="size-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
