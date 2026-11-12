import { Skeleton } from "@repo/ui/components/shadcn/skeleton";

export default function FindWorkLoading() {
  return (
    <div className="flex flex-1 flex-col bg-background font-sans min-h-0">
      <div className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Skeleton className="h-9 w-64 rounded-md" />
            <Skeleton className="h-10 w-40 rounded-full" />
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2">
            <Skeleton className="h-9 w-32 rounded-full" />
            <Skeleton className="h-9 w-28 rounded-full" />
            <Skeleton className="h-9 w-32 rounded-full" />
            <Skeleton className="h-9 w-24 rounded-full" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-4">
            <Skeleton className="h-12 w-full rounded-full" />
            <div className="space-y-4 pt-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-[28px] border border-border bg-card p-6 space-y-4"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2 w-3/4">
                      <div className="flex gap-2">
                        <Skeleton className="h-5 w-24 rounded-full" />
                        <Skeleton className="h-5 w-16 rounded-full" />
                      </div>
                      <Skeleton className="h-6 w-5/6 rounded-md" />
                    </div>
                    <Skeleton className="size-9 rounded-full" />
                  </div>
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-4/5 rounded-md" />
                  <div className="flex flex-wrap gap-2 pt-2">
                    <Skeleton className="h-6 w-20 rounded-full" />
                    <Skeleton className="h-6 w-24 rounded-full" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:block lg:col-span-1 space-y-6">
            <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
              <Skeleton className="h-6 w-32 rounded-md" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-5/6 rounded-md" />
              </div>
            </div>
            <div className="rounded-3xl border border-border bg-card p-6 space-y-3">
              <Skeleton className="h-6 w-28 rounded-md" />
              <Skeleton className="h-10 w-full rounded-xl" />
              <Skeleton className="h-10 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

