import { Skeleton } from "@repo/ui/components/shadcn/skeleton";

export default function AdminLoading() {
  return (
    <div className="flex flex-1 flex-col bg-background font-sans min-h-0 p-6 sm:p-8 space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-md" />
          <Skeleton className="h-4 w-64 rounded-md" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-24 rounded-xl" />
      </div>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-72 rounded-md" />
          <Skeleton className="h-10 w-32 rounded-md" />
        </div>
        <div className="space-y-2 pt-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </div>
  );
}

