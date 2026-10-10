import { Skeleton } from "@repo/ui/components/shadcn/skeleton";

export default function PostDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <div className="border-b bg-gradient-to-b from-emerald-50/80 via-green-50/30 to-background">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <Skeleton className="mb-5 h-4 w-72" />
          <Skeleton className="mb-4 h-4 w-40" />
          <Skeleton className="h-6 w-28 rounded-full" />
        </div>
      </div>

      {/* Content skeleton */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Title */}
        <Skeleton className="h-9 w-3/4" />

        {/* Author */}
        <div className="mt-4 flex items-center gap-3">
          <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>

        <div className="my-6 h-px bg-border" />

        {/* Body */}
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
          <div className="pt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-2/3" />
          </div>
        </div>

        <div className="my-6 h-px bg-border" />

        {/* Actions bar */}
        <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-card px-4 py-2.5 shadow-xs">
          <Skeleton className="h-8 w-20 rounded-md" />
          <div className="h-5 w-px bg-border" />
          <Skeleton className="h-8 w-16 rounded-md" />
        </div>

        {/* Comments section */}
        <div className="mt-10 space-y-6">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-5 w-8 rounded-full" />
          </div>

          {/* Comment form */}
          <div className="rounded-xl border border-border/60 p-4 space-y-3">
            <div className="flex gap-3">
              <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-20 w-full rounded-lg" />
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-8 w-24 rounded-md" />
                </div>
              </div>
            </div>
          </div>

          {/* Comment items */}
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-border/60 p-4 space-y-3">
              <div className="flex gap-3">
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-px" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <div className="flex items-center gap-1 pt-1">
                    <Skeleton className="h-6 w-16 rounded-md" />
                    <Skeleton className="h-6 w-14 rounded-md" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
