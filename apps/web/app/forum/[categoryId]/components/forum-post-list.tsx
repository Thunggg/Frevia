"use client";

import { useCallback, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Heart,
  Inbox,
  MessageSquare,
  Search,
  User,
  X,
} from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import type {
  ForumPostWithUserType,
  ForumTopPostType,
  PaginationMeta,
} from "@shared/types";

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

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

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
  const hasActiveFilters = Boolean(currentSearch) || isMyPosts;

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
      navigateToPage(1, searchInput.trim(), undefined, isMyPosts);
    },
    [navigateToPage, searchInput, isMyPosts],
  );

  const handleLimitChange = useCallback(
    (value: string) => {
      navigateToPage(1, searchInput, Number(value), isMyPosts);
    },
    [navigateToPage, searchInput, isMyPosts],
  );

  const toggleMyPosts = useCallback(() => {
    navigateToPage(1, searchInput, undefined, !isMyPosts);
  }, [navigateToPage, searchInput, isMyPosts]);

  const clearSearch = useCallback(() => {
    setSearchInput("");
    navigateToPage(1, "", undefined, isMyPosts);
  }, [navigateToPage, isMyPosts]);

  const clearAllFilters = useCallback(() => {
    setSearchInput("");
    navigateToPage(1, "", undefined, false);
  }, [navigateToPage]);

  const getPageNumbers = (): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    pages.push(1);
    if (currentPage > 3) pages.push("ellipsis");

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (currentPage < totalPages - 2) pages.push("ellipsis");
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  const showTrending = topPosts.length > 0 && !isMyPosts && !currentSearch;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <form onSubmit={handleSearchSubmit} className="w-full max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search posts..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-11 pl-10 pr-10"
            />
            {searchInput ? (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-4" />
              </button>
            ) : null}
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {currentUserId ? (
            <Button
              variant={isMyPosts ? "default" : "outline"}
              className={`h-11 gap-1.5 ${
                isMyPosts
                  ? "bg-[#4fae2e] text-white hover:bg-[#459928] dark:bg-[#4fae2e] dark:text-white dark:hover:bg-[#5bc03a]"
                  : ""
              }`}
              onClick={toggleMyPosts}
              aria-pressed={isMyPosts}
            >
              <User className="size-3.5" />
              My Posts
            </Button>
          ) : null}
          <CreatePostDialog
            categoryId={categoryId}
            categoryName={categoryName}
            currentUserId={currentUserId}
          />
          <Select value={String(limit)} onValueChange={handleLimitChange}>
            <SelectTrigger className="h-11 w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 / page</SelectItem>
              <SelectItem value="10">10 / page</SelectItem>
              <SelectItem value="20">20 / page</SelectItem>
              <SelectItem value="50">50 / page</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {hasActiveFilters ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-muted-foreground">Filters:</span>
          {currentSearch ? (
            <button
              type="button"
              onClick={clearSearch}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#4fae2e]/30 bg-[#eaf8df] px-3 py-1 text-sm text-foreground transition-colors hover:border-[#4fae2e]/50 dark:bg-[#1a1c1a]"
            >
              Search: {currentSearch}
              <X className="size-3.5 text-muted-foreground" />
            </button>
          ) : null}
          {isMyPosts ? (
            <button
              type="button"
              onClick={() => navigateToPage(1, searchInput, undefined, false)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#4fae2e]/30 bg-[#eaf8df] px-3 py-1 text-sm text-foreground transition-colors hover:border-[#4fae2e]/50 dark:bg-[#1a1c1a]"
            >
              My posts
              <X className="size-3.5 text-muted-foreground" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-sm font-medium text-[#4fae2e] transition-colors hover:text-[#3f9225]"
          >
            Clear all
          </button>
        </div>
      ) : null}

      <div
        className={`grid gap-8 ${
          showTrending ? "lg:grid-cols-12" : "grid-cols-1"
        }`}
      >
        {showTrending ? (
          <aside className="order-2 lg:order-1 lg:col-span-4">
            <div className="sticky top-20 rounded-xl border border-border bg-background p-5 sm:p-6">
              <h2 className="text-base font-semibold tracking-tight text-foreground">
                Trending in {categoryName}
              </h2>
              <ul className="mt-4 divide-y divide-border">
                {topPosts.map((post, index) => (
                  <li key={post.id}>
                    <Link
                      href={`/forum/${post.categoryId ?? categoryId}/${post.id}`}
                      className="group flex items-start gap-3 py-3"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#eaf8df] text-xs font-semibold text-[#4fae2e] dark:bg-[#4fae2e]/15">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground transition-colors group-hover:text-[#4fae2e]">
                          {post.title}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <Heart className="size-3 text-[#4fae2e]" />
                            {post.likeCount}
                          </span>
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare className="size-3" />
                            {post.commentCount}
                          </span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        ) : null}

        <div
          className={`order-1 ${showTrending ? "lg:order-2 lg:col-span-8" : ""}`}
        >
          {pagination.total > 0 ? (
            <p className="mb-4 text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {Math.min((currentPage - 1) * limit + 1, pagination.total)}-
                {Math.min(currentPage * limit, pagination.total)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground">
                {pagination.total}
              </span>{" "}
              {pagination.total === 1 ? "post" : "posts"}
              {isMyPosts ? " (yours)" : ""}
            </p>
          ) : null}

          <div
            className={`transition-opacity ${
              isPending ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {posts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15">
                  <Inbox className="size-7" />
                </div>
                <p className="text-lg font-medium text-foreground">
                  {isMyPosts
                    ? "You have no posts here"
                    : currentSearch
                      ? "No posts found"
                      : "No posts yet"}
                </p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                  {isMyPosts
                    ? "Create a post to get started."
                    : currentSearch
                      ? `No results for "${currentSearch}". Try a different search.`
                      : "Be the first to create a post in this category."}
                </p>
                {hasActiveFilters ? (
                  <Button
                    className="mt-6 bg-[#4fae2e] text-white hover:bg-[#459928]"
                    onClick={clearAllFilters}
                  >
                    Clear filters
                  </Button>
                ) : null}
              </div>
            ) : (
              <ul className="divide-y divide-border border-y border-border">
                {posts.map((post) => (
                  <li key={post.id}>
                    <Link
                      href={`/forum/${categoryId}/${post.id}`}
                      className="group block px-3 py-6 transition-colors hover:bg-[#eaf8df]/35 sm:px-5 sm:py-7 dark:hover:bg-white/4"
                    >
                      <h3 className="text-base font-semibold tracking-tight text-foreground transition-colors group-hover:text-[#4fae2e] sm:text-lg">
                        {post.title}
                      </h3>
                      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                        {stripHtml(post.content)}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-2">
                          <Avatar size="sm">
                            <AvatarImage
                              src={
                                post.user?.profile?.avatarUrl ?? undefined
                              }
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
                          <span className="font-medium text-foreground">
                            {post.user?.profile?.displayName ??
                              `User #${post.userId}`}
                          </span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-[#4fae2e]" />
                          {formatDate(post.createdAt)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Heart className="size-3.5 text-[#4fae2e]" />
                          {post.likeCount}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <MessageSquare className="size-3.5" />
                          {post.commentCount}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {totalPages > 1 ? (
            <div className="flex justify-center pt-8">
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
                    pageNum === "ellipsis" ? (
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
          ) : null}
        </div>
      </div>
    </div>
  );
}
