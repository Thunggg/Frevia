"use client";

import { Suspense } from "react";
import { useForumPosts, useForumTopPosts } from "@/hooks/use-forum";
import { ForumPostList } from "./forum-post-list";
import type {
  ForumPostFilterType,
  ForumPostWithUserType,
  ForumTopPostType,
} from "@shared/types";
import { Card, CardContent } from "@repo/ui/components/shadcn/card";

type ForumPostListWrapperProps = {
  filter: ForumPostFilterType;
  categoryId: number;
  categoryName: string;
  currentSearch?: string;
  currentUserId: number | null;
  isMyPosts: boolean;
};

export function ForumPostListWrapper({
  filter,
  categoryId,
  categoryName,
  currentSearch,
  currentUserId,
  isMyPosts,
}: ForumPostListWrapperProps) {
  const { data: postsData, isLoading: isLoadingPosts } = useForumPosts(filter);
  const { data: topPosts, isLoading: isLoadingTopPosts } = useForumTopPosts(3);

  if (isLoadingPosts || isLoadingTopPosts) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-10 w-full max-w-md rounded-lg bg-muted animate-pulse" />
          <div className="h-10 w-[100px] rounded-lg bg-muted animate-pulse" />
        </div>
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-5">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-3/5 rounded bg-muted animate-pulse" />
                    <div className="h-5 w-12 rounded-full bg-muted animate-pulse" />
                  </div>
                  <div className="h-4 w-full rounded bg-muted animate-pulse" />
                  <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
                  <div className="flex items-center gap-3">
                    <div className="h-4 w-24 rounded bg-muted animate-pulse" />
                    <div className="h-4 w-20 rounded bg-muted animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const posts: ForumPostWithUserType[] = postsData?.posts ?? [];
  const pagination = postsData?.pagination ?? {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  };

  // Lọc posts theo search nếu có
  const filteredPosts = currentSearch
    ? posts.filter((p) =>
        p.title.toLowerCase().includes(currentSearch.toLowerCase()),
      )
    : posts;

  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-5">
                <div className="h-5 w-3/4 rounded bg-muted animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      }
    >
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
