"use client";

import { Suspense } from "react";

import type { ForumPostFilterType, ForumPostWithUserType } from "@shared/types";

import { useForumPosts, useForumTopPosts } from "@/hooks/use-forum";

import { ForumPostList } from "./forum-post-list";

type ForumPostListWrapperProps = {
  filter: ForumPostFilterType;
  categoryId: number;
  categoryName: string;
  currentSearch?: string;
  currentUserId: number | null;
  isMyPosts: boolean;
};

function ListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="h-11 w-full max-w-md animate-pulse rounded-lg bg-muted" />
        <div className="flex gap-2">
          <div className="h-11 w-28 animate-pulse rounded-lg bg-muted" />
          <div className="h-11 w-28 animate-pulse rounded-lg bg-muted" />
          <div className="h-11 w-[120px] animate-pulse rounded-lg bg-muted" />
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        <aside className="order-2 lg:order-1 lg:col-span-4">
          <div className="space-y-4 rounded-xl border border-border p-5 sm:p-6">
            <div className="h-5 w-40 animate-pulse rounded bg-muted" />
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-start gap-3 py-2">
                <div className="size-7 shrink-0 animate-pulse rounded-full bg-muted" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
                  <div className="h-3 w-24 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </aside>

        <div className="order-1 space-y-0 lg:order-2 lg:col-span-8">
          <div className="mb-4 h-4 w-48 animate-pulse rounded bg-muted" />
          <div className="divide-y divide-border border-y border-border">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="space-y-3 px-3 py-6 sm:px-5 sm:py-7"
              >
                <div className="h-6 w-3/5 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-4/5 animate-pulse rounded bg-muted" />
                <div className="flex items-center gap-3 pt-1">
                  <div className="size-8 animate-pulse rounded-full bg-muted" />
                  <div className="h-4 w-28 animate-pulse rounded bg-muted" />
                  <div className="h-4 w-24 animate-pulse rounded bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ForumPostListWrapper({
  filter,
  categoryId,
  categoryName,
  currentSearch,
  currentUserId,
  isMyPosts,
}: ForumPostListWrapperProps) {
  const { data: postsData, isLoading: isLoadingPosts } = useForumPosts(filter);
  const { data: topPosts, isLoading: isLoadingTopPosts } = useForumTopPosts(
    3,
    categoryId,
  );

  if (isLoadingPosts || isLoadingTopPosts) {
    return <ListSkeleton />;
  }

  const posts: ForumPostWithUserType[] = postsData?.posts ?? [];
  const pagination = postsData?.pagination ?? {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  };

  const filteredPosts = currentSearch
    ? posts.filter((p) =>
        p.title.toLowerCase().includes(currentSearch.toLowerCase()),
      )
    : posts;

  return (
    <Suspense fallback={<ListSkeleton />}>
      <ForumPostList
        posts={filteredPosts}
        pagination={pagination}
        categoryId={categoryId}
        categoryName={categoryName}
        currentSearch={currentSearch}
        currentUserId={currentUserId}
        isMyPosts={isMyPosts}
        topPosts={topPosts ?? []}
      />
    </Suspense>
  );
}
