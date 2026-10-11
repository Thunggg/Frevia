import { Skeleton } from "@repo/ui/components/shadcn/skeleton";

export default function SessionsLoading() {
  return (
    <div className="min-h-dvh bg-background font-sans">
      <div className="h-14 border-b border-border bg-[#eaf8df] dark:bg-[#161716]" />

      <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-white/10 dark:bg-[#1a1c1a]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <Skeleton className="mb-4 h-4 w-28 bg-[#4fae2e]/15" />
          <Skeleton className="h-10 w-48 bg-[#4fae2e]/15" />
          <Skeleton className="mt-3 h-4 w-96 max-w-full bg-[#4fae2e]/10" />
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Skeleton className="mb-6 h-11 w-full max-w-md" />
        <div className="divide-y divide-border border-y border-border">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col gap-3 px-3 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-5"
            >
              <div className="space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-72 max-w-full" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
