"use client";

import { useState, useCallback, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@repo/ui/components/shadcn/card";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import { Separator } from "@repo/ui/components/shadcn/separator";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@repo/ui/components/shadcn/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@repo/ui/components/shadcn/pagination";
import {
  Search,
  Calendar,
  MessageSquare,
  SlidersHorizontal,
  Inbox,
  User,
  TrendingUp,
  Heart,
  Flame,
} from "lucide-react";
import type {
  ForumPostWithUserType,
  PaginationMeta,
  ForumTopPostType,
} from "@shared/types";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}
import { CreatePostDialog } from "./create-post-dialog";

type ForumPostListProps = {
  posts: ForumPostWithUserType[];
  pagination: PaginationMeta;
  categoryId: number;
  categoryName: string;
  currentSearch?: string;
  currentUserId: number | null;
  isMyPosts: boolean;
  topPosts: ForumTopPostType[];
};

export function ForumPostList({
  posts,
  pagination,
  categoryId,
  categoryName,
  currentSearch,
  currentUserId,
  isMyPosts,
  topPosts,
}: ForumPostListProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(currentSearch ?? "");

  const currentPage = pagination.page;
  const totalPages = pagination.totalPages;
  const limit = pagination.limit;

  const navigateToPage = useCallback(
    (page: number, search?: string, newLimit?: number, myPosts?: boolean) => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(newLimit ?? limit));
      if (search) {
        params.set("search", search);
      }
      if (myPosts) {
        params.set("myPosts", "1");
      }

      startTransition(() => {
        router.push(`/forum/${categoryId}?${params.toString()}`);
      });
    },
    [router, categoryId, limit],
  );

  const handleSearchSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      navigateToPage(1, searchInput, undefined, isMyPosts);
    },
    [navigateToPage, searchInput, isMyPosts],
  );

  const handleLimitChange = useCallback(
    (value: string) => {
      const newLimit = Number(value);
      navigateToPage(1, searchInput, newLimit, isMyPosts);
    },
    [navigateToPage, searchInput, isMyPosts],
  );

  const toggleMyPosts = useCallback(() => {
    navigateToPage(1, searchInput, undefined, !isMyPosts);
  }, [navigateToPage, searchInput, isMyPosts]);

  const getPageNumbers = (): (number | "...")[] => {
    const pages: (number | "...")[] = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);

      if (currentPage > 3) {
        pages.push("...");
      }

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push("...");
      }

      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  const showTrending = topPosts.length > 0 && !isMyPosts && !currentSearch;

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search posts..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-10 pl-10"
            />
          </div>
        </form>

        <div className="flex items-center gap-2">
          {currentUserId && (
            <Button
              variant={isMyPosts ? "default" : "outline"}
              size="sm"
              className="gap-1.5"
              onClick={toggleMyPosts}
            >
              <User className="h-3.5 w-3.5" />
              My Posts
            </Button>
          )}
          <CreatePostDialog
            categoryId={categoryId}
            categoryName={categoryName}
          />
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
          <Select value={String(limit)} onValueChange={handleLimitChange}>
            <SelectTrigger className="h-10 w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 per page</SelectItem>
              <SelectItem value="10">10 per page</SelectItem>
              <SelectItem value="20">20 per page</SelectItem>
              <SelectItem value="50">50 per page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Grid: Trending sidebar + Post list */}
      <div
        className={`grid gap-6 ${showTrending ? "grid-cols-1 lg:grid-cols-[280px_1fr]" : "grid-cols-1"}`}
      >
        {/* Trending Posts - Left sidebar */}
        {showTrending && (
          <div className="order-2 lg:order-1">
            <div className="sticky top-24 rounded-xl border bg-gradient-to-br from-orange-500/5 via-amber-500/5 to-yellow-500/5 p-5">
              <div className="flex items-center gap-2 mb-4">
                <Flame className="h-5 w-5 text-orange-500" />
                <h3 className="text-sm font-semibold text-foreground">
                  Trending This Week
                </h3>
                <Badge
                  variant="secondary"
                  className="ml-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 text-[10px] px-1.5 py-0"
                >
                  HOT
                </Badge>
              </div>
              <div className="space-y-1">
                {topPosts.map((post, index) => (
                  <Link
                    key={post.id}
                    href={`/forum/${categoryId}/${post.id}`}
                    className="group flex items-start gap-3 rounded-lg p-2.5 transition-colors hover:bg-orange-500/5"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-xs font-bold text-orange-600 dark:text-orange-400">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium leading-snug text-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 line-clamp-2">
                        {post.title}
                      </p>
                      <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1">
                          <Heart className="h-3 w-3" />
                          {post.likeCount}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {post.commentCount}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          {post.interactionScore}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Post List - Right side */}
        <div className={`order-1 ${showTrending ? "lg:order-2" : ""}`}>
          {/* Results info */}
          {pagination.total > 0 && (
            <p className="mb-4 text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {Math.min((currentPage - 1) * limit + 1, pagination.total)}–
                {Math.min(currentPage * limit, pagination.total)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {pagination.total}
              </span>{" "}
              {pagination.total === 1 ? "post" : "posts"}
              {isMyPosts && " (your posts)"}
            </p>
          )}

          {/* Post Items */}
          <div
            className={`space-y-4 transition-opacity ${isPending ? "pointer-events-none opacity-50" : ""}`}
          >
            {posts.length === 0 ? (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                    <Inbox className="h-7 w-7 text-muted-foreground" />
                  </div>
                  <p className="text-sm font-medium text-foreground">
                    {isMyPosts
                      ? "You have no posts here"
                      : currentSearch
                        ? "No posts found"
                        : "No posts yet"}
                  </p>
                  <p className="mt-1 text-center text-sm text-muted-foreground">
                    {isMyPosts
                      ? "Create a post to get started."
                      : currentSearch
                        ? `No results for "${currentSearch}". Try a different search term.`
                        : "Be the first to create a post in this category."}
                  </p>
                  {currentSearch && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-4"
                      onClick={() => {
                        setSearchInput("");
                        navigateToPage(1, "", undefined, isMyPosts);
                      }}
                    >
                      Clear search
                    </Button>
                  )}
                </CardContent>
              </Card>
            ) : (
              posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/forum/${categoryId}/${post.id}`}
                  className="block"
                >
                  <Card className="group transition-all duration-200 hover:border-primary/20 hover:shadow-sm">
                    <CardContent className="py-5">
                      <div className="space-y-3">
                        {/* Title + Badge */}
                        <div className="flex items-start justify-between gap-3">
                          <h3 className="text-base font-semibold leading-snug text-foreground group-hover:text-primary transition-colors">
                            {post.title}
                          </h3>
                          <Badge
                            variant="secondary"
                            className="shrink-0 gap-1 text-xs"
                          >
                            <MessageSquare className="h-3 w-3" />#{post.id}
                          </Badge>
                        </div>

                        {/* Content preview */}
                        <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {stripHtml(post.content)}
                        </p>

                        {/* Meta row */}
                        <div className="flex items-center gap-3 pt-1">
                          <div className="flex items-center gap-2">
                            <Avatar size="sm">
                              <AvatarImage
                                src={post.user?.profile?.avatarUrl ?? undefined}
                                alt={
                                  post.user?.profile?.displayName ??
                                  `User #${post.userId}`
                                }
                              />
                              <AvatarFallback className="text-[10px]">
                                {post.user?.profile?.displayName
                                  ?.charAt(0)
                                  ?.toUpperCase() ?? "?"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-foreground">
                              {post.user?.profile?.displayName ??
                                `User #${post.userId}`}
                            </span>
                          </div>
                          <Separator orientation="vertical" className="h-4" />
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {new Date(post.createdAt).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              },
                            )}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center pt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage > 1) {
                          navigateToPage(
                            currentPage - 1,
                            currentSearch,
                            undefined,
                            isMyPosts,
                          );
                        }
                      }}
                      aria-disabled={currentPage <= 1}
                      className={
                        currentPage <= 1
                          ? "pointer-events-none opacity-50"
                          : undefined
                      }
                    />
                  </PaginationItem>

                  {getPageNumbers().map((pageNum, index) =>
                    pageNum === "..." ? (
                      <PaginationItem key={`ellipsis-${index}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={pageNum}>
                        <PaginationLink
                          href="#"
                          isActive={pageNum === currentPage}
                          onClick={(e) => {
                            e.preventDefault();
                            navigateToPage(
                              pageNum,
                              currentSearch,
                              undefined,
                              isMyPosts,
                            );
                          }}
                        >
                          {pageNum}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        if (currentPage < totalPages) {
                          navigateToPage(
                            currentPage + 1,
                            currentSearch,
                            undefined,
                            isMyPosts,
                          );
                        }
                      }}
                      aria-disabled={currentPage >= totalPages}
                      className={
                        currentPage >= totalPages
                          ? "pointer-events-none opacity-50"
                          : undefined
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
