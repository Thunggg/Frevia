import { Skeleton } from "@repo/ui/components/shadcn/skeleton";

export default function JobDetailLoading() {
  return (
    <div className="flex flex-1 flex-col bg-background font-sans min-h-0">
      <div className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-4">
          <Skeleton className="h-6 w-32 rounded-full" />
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Skeleton className="h-9 w-2/3 rounded-md" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-28 rounded-full" />
              <Skeleton className="h-10 w-32 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-3xl border border-border bg-card p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap gap-4 border-b border-border pb-6">
                <Skeleton className="h-8 w-32 rounded-xl" />
                <Skeleton className="h-8 w-40 rounded-xl" />
                <Skeleton className="h-8 w-28 rounded-xl" />
              </div>
              <div className="space-y-3">
                <Skeleton className="h-6 w-40 rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-4/5 rounded-md" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
              </div>
              <div className="space-y-3 pt-4">
                <Skeleton className="h-6 w-36 rounded-md" />
                <div className="flex flex-wrap gap-2">
                  <Skeleton className="h-8 w-24 rounded-full" />
                  <Skeleton className="h-8 w-28 rounded-full" />
                  <Skeleton className="h-8 w-20 rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
              <Skeleton className="h-6 w-44 rounded-md" />
              <div className="space-y-3">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-5/6 rounded-md" />
                <Skeleton className="h-4 w-3/4 rounded-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

