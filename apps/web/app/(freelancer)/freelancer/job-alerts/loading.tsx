import { Skeleton } from "@repo/ui/components/shadcn/skeleton";

export default function JobAlertsLoading() {
  return (
    <div className="flex flex-1 flex-col bg-background font-sans min-h-0">
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-2">
              <Skeleton className="h-8 w-56" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24 rounded-full" />
              <Skeleton className="h-9 w-36 rounded-full" />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
        <Skeleton className="h-10 w-full sm:w-80 rounded-full mb-6" />

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex min-h-60 flex-col rounded-xl border border-border bg-card p-5 space-y-4"
            >
              <div className="flex justify-between items-start">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-9 rounded-full" />
              </div>
              <Skeleton className="h-4 w-52" />
              <div className="flex gap-1.5">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <div className="mt-auto pt-4 flex justify-between items-center border-t border-border/40">
                <Skeleton className="h-8 flex-1 rounded-lg mr-2" />
                <Skeleton className="size-8 rounded-lg mr-1" />
                <Skeleton className="size-8 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
