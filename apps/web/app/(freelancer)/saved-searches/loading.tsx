import { Skeleton } from "@repo/ui/components/shadcn/skeleton";

export default function SavedSearchesLoading() {
  return (
    <div className="min-h-dvh bg-background font-sans">
      <div className="h-14 border-b border-border bg-[#eaf8df] dark:bg-[#161716]" />
      <div className="border-b border-[#4fae2e]/15 bg-[#eaf8df] px-4 py-10 dark:bg-[#1a1c1a] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl space-y-3">
          <Skeleton className="h-4 w-32 bg-[#4fae2e]/15" />
          <Skeleton className="h-10 w-64 bg-[#4fae2e]/15" />
          <Skeleton className="h-4 w-96 max-w-full bg-[#4fae2e]/10" />
        </div>
      </div>
      <div className="mx-auto grid max-w-7xl gap-4 px-4 py-8 md:grid-cols-2 xl:grid-cols-3 sm:px-6 lg:px-8">
        {Array.from({ length: 3 }).map((_, index) => (
          <Skeleton key={index} className="h-52 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
