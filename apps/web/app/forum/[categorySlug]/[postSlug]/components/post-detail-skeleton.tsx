import { Skeleton } from "@repo/ui/components/shadcn/skeleton";

// Skeleton mô phỏng đúng layout trang post detail:
// breadcrumb hero + bài viết (title/author/content/actions/comments) + sidebar bài liên quan.
export function PostDetailSkeleton() {
  return (
    <div>
      <section className="border-b border-border/40 bg-background">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="bg-[#0069D3]/5 h-3.5 w-10" />
            <span className="text-foreground/25">/</span>
            <Skeleton className="bg-[#0069D3]/5 h-3.5 w-24 max-w-[120px]" />
            <span className="text-foreground/25">/</span>
            <Skeleton className="bg-[#0069D3]/5 h-3.5 w-40 max-w-[180px]" />
          </div>
          <div className="mt-4 flex items-center gap-1.5">
            <Skeleton className="bg-[#0069D3]/5 h-3.5 w-20" />
            <Skeleton className="bg-[#0069D3]/5 h-3.5 w-24" />
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-10 lg:flex-row">
          <article className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-4">
              <Skeleton className="bg-[#0069D3]/5 h-8 w-3/4 max-w-xl sm:h-9" />
              <div className="hidden shrink-0 items-center gap-1 sm:flex">
                <Skeleton className="bg-[#0069D3]/5 h-7 w-16 rounded-md" />
                <Skeleton className="bg-[#0069D3]/5 h-7 w-16 rounded-md" />
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <Skeleton className="bg-[#0069D3]/5 size-10 shrink-0 rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="bg-[#0069D3]/5 h-4 w-32" />
                <Skeleton className="bg-[#0069D3]/5 h-3 w-40" />
              </div>
            </div>

            <div className="mt-8 max-w-prose space-y-3">
              <Skeleton className="bg-[#0069D3]/5 h-4 w-full" />
              <Skeleton className="bg-[#0069D3]/5 h-4 w-full" />
              <Skeleton className="bg-[#0069D3]/5 h-4 w-11/12" />
              <Skeleton className="bg-[#0069D3]/5 h-4 w-full" />
              <Skeleton className="bg-[#0069D3]/5 h-4 w-4/5" />
              <Skeleton className="bg-[#0069D3]/5 h-4 w-full" />
              <Skeleton className="bg-[#0069D3]/5 h-4 w-2/3" />
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-1 border-y border-border/40 py-3">
              <Skeleton className="bg-[#0069D3]/5 h-8 w-16 rounded-md" />
              <Skeleton className="bg-[#0069D3]/5 h-8 w-12 rounded-md" />
              <Skeleton className="bg-[#0069D3]/5 h-8 w-20 rounded-md" />
            </div>

            <div className="mt-2">
              <Skeleton className="bg-[#0069D3]/5 h-7 w-36 rounded-full" />
            </div>

            <div className="mt-10 space-y-6">
              <div className="flex items-center gap-2.5">
                <Skeleton className="bg-[#0069D3]/5 size-4" />
                <Skeleton className="bg-[#0069D3]/5 h-5 w-24" />
                <Skeleton className="bg-[#0069D3]/5 h-5 w-7 rounded-full" />
              </div>

              <div className="rounded-xl border border-border/40 bg-background p-4 sm:p-5">
                <div className="flex gap-3">
                  <Skeleton className="bg-[#0069D3]/5 size-8 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-3">
                    <Skeleton className="bg-[#0069D3]/5 h-24 w-full rounded-lg" />
                    <div className="flex items-center justify-between gap-3">
                      <Skeleton className="bg-[#0069D3]/5 h-3 w-40" />
                      <Skeleton className="bg-[#0069D3]/5 h-8 w-24 rounded-md" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {Array.from({ length: 2 }).map((_, index) => (
                  <div
                    key={index}
                    className="rounded-xl border border-border/30 bg-background"
                  >
                    <div className="px-4 py-4 sm:px-5">
                      <div className="flex gap-3">
                        <Skeleton className="bg-[#0069D3]/5 size-8 shrink-0 rounded-full" />
                        <div className="min-w-0 flex-1 space-y-2">
                          <Skeleton className="bg-[#0069D3]/5 h-3.5 w-1/3" />
                          <Skeleton className="bg-[#0069D3]/5 h-3 w-full" />
                          <Skeleton className="bg-[#0069D3]/5 h-3 w-4/5" />
                          <div className="flex items-center gap-2 pt-1">
                            <Skeleton className="bg-[#0069D3]/5 h-6 w-14 rounded-md" />
                            <Skeleton className="bg-[#0069D3]/5 h-6 w-14 rounded-md" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <aside className="w-full shrink-0 lg:w-72 lg:pt-10">
            <div className="lg:sticky lg:top-20">
              <div className="rounded-xl border border-border/40 bg-background p-4">
                <Skeleton className="bg-[#0069D3]/5 mb-4 h-4 w-32" />
                <div className="space-y-3">
                  {Array.from({ length: 3 }).map((_, index) => (
                    <div key={index} className="flex gap-3">
                      <Skeleton className="bg-[#0069D3]/5 size-8 shrink-0 rounded-full" />
                      <div className="flex-1 space-y-1.5">
                        <Skeleton className="bg-[#0069D3]/5 h-3.5 w-3/4" />
                        <Skeleton className="bg-[#0069D3]/5 h-2.5 w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
                <Skeleton className="bg-[#0069D3]/5 mt-3 h-7 w-full rounded-lg" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
