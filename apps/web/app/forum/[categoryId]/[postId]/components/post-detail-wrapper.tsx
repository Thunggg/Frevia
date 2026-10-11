"use client";

import Link from "next/link";

import { useForumPost } from "@/hooks/use-forum";

import { PostDetailView } from "./post-detail-view";

type PostDetailWrapperProps = {
  postId: number;
  categoryId: number;
  currentUserId: number | null;
};

function PostDetailSkeleton() {
  return (
    <div>
      <section className="border-b border-border/40 bg-background">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="flex items-center gap-2 text-[13px]">
            <div className="h-3.5 w-10 animate-pulse rounded bg-muted" />
            <span className="text-foreground/25">/</span>
            <div className="h-3.5 w-14 animate-pulse rounded bg-muted" />
            <span className="text-foreground/25">/</span>
            <div className="h-3.5 w-20 animate-pulse rounded bg-muted" />
            <span className="text-foreground/25">/</span>
            <div className="h-3.5 w-40 animate-pulse rounded bg-muted" />
          </div>
          <div className="mt-4 h-3.5 w-48 animate-pulse rounded bg-muted" />
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-10 lg:flex-row">
          <div className="min-w-0 flex-1">
            <div className="h-8 w-3/4 animate-pulse rounded bg-muted sm:h-9" />
            <div className="mt-5 flex items-center gap-3">
              <div className="size-10 shrink-0 animate-pulse rounded-full bg-muted" />
              <div className="space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="flex items-center gap-1.5">
                  <div className="size-3 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                </div>
              </div>
            </div>
            <div className="mt-8 max-w-prose space-y-3">
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-11/12 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
              <div className="h-4 w-full animate-pulse rounded bg-muted" />
              <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
            </div>
            <div className="mt-8 flex items-center gap-2 border-y border-border/40 py-3">
              <div className="h-9 w-16 animate-pulse rounded-md bg-muted" />
              <div className="h-9 w-14 animate-pulse rounded-md bg-muted" />
            </div>
            <div className="mt-3 h-7 w-32 animate-pulse rounded bg-muted" />
            <div className="mt-10 space-y-4">
              <div className="flex items-center gap-2">
                <div className="size-4 animate-pulse rounded bg-muted" />
                <div className="h-5 w-24 animate-pulse rounded bg-muted" />
                <div className="h-5 w-7 animate-pulse rounded-full bg-muted" />
              </div>
              <div className="rounded-xl border border-border/40 bg-background p-4 sm:p-5">
                <div className="flex gap-3">
                  <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-32 animate-pulse rounded bg-muted" />
                    <div className="h-20 w-full animate-pulse rounded-lg bg-muted/50" />
                    <div className="flex justify-end">
                      <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
                    </div>
                  </div>
                </div>
              </div>
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border/30 bg-background px-4 py-4 sm:px-5">
                  <div className="flex gap-3">
                    <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-3.5 w-24 animate-pulse rounded bg-muted" />
                        <div className="h-2.5 w-20 animate-pulse rounded bg-muted" />
                      </div>
                      <div className="h-3 w-full animate-pulse rounded bg-muted" />
                      <div className="h-3 w-3/4 animate-pulse rounded bg-muted" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <aside className="w-full shrink-0 lg:w-72 lg:pt-10">
            <div className="lg:sticky lg:top-20">
              <div className="rounded-xl border border-border/40 bg-background p-4">
                <div className="mb-3 h-3.5 w-28 animate-pulse rounded bg-muted" />
                <div className="space-y-1">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="flex gap-3 rounded-lg p-2">
                      <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
                      <div className="flex-1 space-y-1.5">
                        <div className="h-3.5 w-3/4 animate-pulse rounded bg-muted" />
                        <div className="flex items-center gap-1.5">
                          <div className="h-2.5 w-16 animate-pulse rounded bg-muted" />
                          <div className="h-2.5 w-10 animate-pulse rounded bg-muted" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 h-7 w-full animate-pulse rounded bg-muted" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export function PostDetailWrapper({
  postId,
  categoryId,
  currentUserId,
}: PostDetailWrapperProps) {
  const { data: post, isLoading: isLoadingPost } = useForumPost(postId);

  if (isLoadingPost) {
    return <PostDetailSkeleton />;
  }

  if (!post) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6">
        <p className="text-lg font-medium text-foreground">Post not found</p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          This post may have been deleted or the link is incorrect.
        </p>
        <Link
          href={`/forum/${categoryId}`}
          className="mt-6 text-sm font-medium text-[#4fae2e] transition-colors hover:text-[#3f9225]"
        >
          Back to category
        </Link>
      </div>
    );
  }

  return (
    <PostDetailView
      post={post}
      categoryId={categoryId}
      currentUserId={currentUserId}
    />
  );
}
