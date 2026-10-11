import { Skeleton } from "@repo/ui/components/shadcn/skeleton";

export default function ProjectsLoading() {
  return (
    <div className="min-h-dvh bg-background font-sans">
      <div className="h-14 border-b border-border bg-[#eaf8df] dark:bg-[#161716]" />

      <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-white/10 dark:bg-[#1a1c1a]">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <Skeleton className="mb-4 h-4 w-28 bg-[#4fae2e]/15" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-3">
              <Skeleton className="h-10 w-40 bg-[#4fae2e]/15" />
              <Skeleton className="h-4 w-80 max-w-full bg-[#4fae2e]/10" />
            </div>
            <Skeleton className="h-11 w-32 bg-[#4fae2e]/20" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="divide-y divide-border border-y border-border">
          {Array.from({ length: 5 }).map((_, index) => (
            <div
              key={index}
              className="flex flex-col gap-4 px-3 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-5 sm:py-7"
            >
              <div className="space-y-2">
                <Skeleton className="h-6 w-56" />
                <Skeleton className="h-4 w-40" />
              </div>
              <div className="flex flex-wrap gap-2">
                <Skeleton className="h-8 w-16" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
