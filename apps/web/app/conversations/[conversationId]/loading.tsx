import { Skeleton } from "@repo/ui/components/shadcn/skeleton";

export default function ConversationDetailLoading() {
  return (
    <div className="flex h-full flex-col">
      {/* Header skeleton */}
      <div className="flex items-center gap-3 border-b px-4 py-3">
        <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Messages skeleton */}
      <div className="flex-1 space-y-4 overflow-hidden px-4 py-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}
          >
            <div
              className={`flex items-end gap-2 ${i % 2 === 0 ? "" : "flex-row-reverse"}`}
            >
              {i % 2 === 0 && (
                <Skeleton className="h-8 w-8 shrink-0 rounded-full" />
              )}
              <div className="space-y-1.5">
                <Skeleton
                  className={`h-10 rounded-2xl ${i % 2 === 0 ? "rounded-bl-sm w-52" : "rounded-br-sm w-44"}`}
                />
                <Skeleton
                  className={`h-3 ${i % 2 === 0 ? "w-16" : "w-12 ml-auto"}`}
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Input skeleton */}
      <div className="border-t p-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 flex-1 rounded-lg" />
          <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
          <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
          <Skeleton className="h-10 w-10 shrink-0 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
