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
      <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-white/10 dark:bg-[#1a1c1a]">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="mb-4 h-4 w-72 max-w-full animate-pulse rounded bg-[#4fae2e]/15" />
          <div className="h-4 w-40 animate-pulse rounded bg-[#4fae2e]/10" />
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <div className="h-9 w-3/4 animate-pulse rounded bg-muted" />
        <div className="mt-5 flex items-center gap-3">
          <div className="size-10 shrink-0 animate-pulse rounded-full bg-muted" />
          <div className="space-y-2">
            <div className="h-4 w-32 animate-pulse rounded bg-muted" />
            <div className="h-3 w-40 animate-pulse rounded bg-muted" />
          </div>
        </div>
        <div className="mt-8 space-y-3">
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-full animate-pulse rounded bg-muted" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-muted" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        </div>
        <div className="mt-8 h-12 animate-pulse rounded bg-muted/60" />
        <div className="mt-10 space-y-4">
          <div className="h-6 w-32 animate-pulse rounded bg-muted" />
          <div className="h-28 animate-pulse rounded-xl border border-border bg-muted/40" />
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
