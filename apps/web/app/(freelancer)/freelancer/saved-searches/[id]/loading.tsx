import { Skeleton } from "@repo/ui/components/shadcn/skeleton";

export default function SavedSearchDetailLoading() {
  return (
    <div className="flex flex-1 flex-col bg-background font-sans min-h-0">
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-32 mb-4" />
          <div className="flex items-center gap-4">
            <Skeleton className="size-12 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-64" />
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 w-full">
        <div className="rounded-xl border border-border bg-card p-6">
          <Skeleton className="h-6 w-36 mb-6" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
            <Skeleton className="h-16 rounded-lg" />
          </div>
          <div className="mt-6 flex justify-between items-center">
            <Skeleton className="h-6 w-28 rounded-full" />
            <Skeleton className="h-10 w-48 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

