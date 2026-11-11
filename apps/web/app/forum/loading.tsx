import { Skeleton } from "@repo/ui/components/shadcn/skeleton";

export default function ForumLoading() {
  return (
    <div className="min-h-dvh bg-background font-sans">
      <section className="border-b border-border/40 bg-background">
        <div className="w-full px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <Skeleton className="mb-4 h-4 w-28 bg-[#0069D3]/5" />
          <div className="space-y-3">
            <Skeleton className="h-10 w-64 bg-[#0069D3]/5" />
            <Skeleton className="h-4 w-96 max-w-full bg-[#0069D3]/5" />
          </div>
        </div>
      </section>

      <div className="grid w-full gap-10 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-10">
        <div className="lg:col-span-8">
          <div className="mb-6 flex flex-col gap-2 sm:flex-row">
            <Skeleton className="h-11 w-full max-w-md rounded-lg bg-[#0069D3]/5" />
            <Skeleton className="h-11 w-28 rounded-lg bg-[#0069D3]/5" />
          </div>

          <div className="divide-y divide-border border-y border-border">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="flex items-start gap-4 px-1 py-5 sm:items-center sm:py-6">
                <Skeleton className="size-10 shrink-0 rounded-full bg-[#0069D3]/5" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-48 bg-[#0069D3]/5" />
                  <Skeleton className="h-4 w-full bg-[#0069D3]/5" />
                  <Skeleton className="h-4 w-3/4 bg-[#0069D3]/5" />
                </div>
                <div className="shrink-0 space-y-1.5 sm:text-right">
                  <Skeleton className="h-4 w-12 bg-[#0069D3]/5" />
                  <Skeleton className="h-3 w-10 bg-[#0069D3]/5" />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-border pt-4 sm:flex-row">
            <Skeleton className="h-4 w-40 bg-[#0069D3]/5" />
            <Skeleton className="h-9 w-48 rounded-lg bg-[#0069D3]/5" />
          </div>
        </div>

        <aside className="space-y-6 lg:col-span-4">
          <div className="rounded-xl border border-border p-5 sm:p-6">
            <Skeleton className="h-5 w-28 bg-[#0069D3]/5" />
            <div className="mt-4 divide-y divide-border">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between py-3">
                  <Skeleton className="h-4 w-3/4 bg-[#0069D3]/5" />
                  <Skeleton className="h-3 w-16 bg-[#0069D3]/5" />
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-border p-5 sm:p-6">
            <Skeleton className="h-5 w-36 bg-[#0069D3]/5" />
            <div className="mt-4 space-y-4">
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Skeleton className="size-10 shrink-0 rounded-full bg-[#0069D3]/5" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-4 w-1/2 bg-[#0069D3]/5" />
                    <Skeleton className="h-3 w-28 bg-[#0069D3]/5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
