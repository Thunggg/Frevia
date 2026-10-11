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
      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <form onSubmit={handleSearchSubmit} className="w-full max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" strokeWidth={1.75} />
            <Input
              type="text"
              placeholder="Search posts..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-9 rounded-lg border-border/60 bg-white/60 pl-9 pr-9 text-[13px] focus:border-[#4fae2e]/50 focus:ring-1 focus:ring-[#4fae2e]/20 dark:bg-white/[0.03]"
            />
            {searchInput ? (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground/50 transition-colors hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
        </form>

        <div className="flex flex-wrap items-center gap-2">
          {currentUserId ? (
            <Button
              variant={isMyPosts ? "default" : "outline"}
              size="sm"
              className={`h-8 gap-1.5 text-[13px] ${
                isMyPosts
                  ? "bg-[#4fae2e] text-white hover:bg-[#459928] dark:hover:bg-[#5bc03a]"
                  : "border-border/60 text-foreground/60 hover:border-[#4fae2e]/40 hover:text-foreground"
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
            <SelectTrigger className="h-8 w-[90px] rounded-lg border-border/60 bg-transparent text-[13px] text-foreground/60">
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

      {/* Filter chips */}
      {hasActiveFilters ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-muted-foreground/50">Filters:</span>
          {currentSearch ? (
            <button
              type="button"
              onClick={clearSearch}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#4fae2e]/20 bg-[#4fae2e]/5 px-2.5 py-0.5 text-[12px] font-medium text-[#4fae2e] transition-colors hover:border-[#4fae2e]/40"
            >
              &quot;{currentSearch}&quot;
              <X className="size-3" />
            </button>
          ) : null}
          {isMyPosts ? (
            <button
              type="button"
              onClick={() => navigateToPage(1, searchInput, undefined, false)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#4fae2e]/20 bg-[#4fae2e]/5 px-2.5 py-0.5 text-[12px] font-medium text-[#4fae2e] transition-colors hover:border-[#4fae2e]/40"
            >
              My posts
              <X className="size-3" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-[12px] font-medium text-muted-foreground/50 transition-colors hover:text-[#4fae2e]"
          >
            Clear all
          </button>
        </div>
      ) : null}

      {/* Main grid */}
      <div
        className={`grid gap-8 ${
          showTrending ? "lg:grid-cols-12" : "grid-cols-1"
        }`}
      >
        {/* Trending sidebar */}
        {showTrending ? (
          <aside className="order-2 lg:order-1 lg:col-span-4">
            <div className="sticky top-20 rounded-xl border border-border/40 bg-background p-5 sm:p-6">
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/50">
                Trending in {categoryName}
              </h2>
              <ul className="mt-4 space-y-1">
                {topPosts.map((post, index) => (
                  <li key={post.id}>
                    <Link
                      href={`/forum/${post.categoryId ?? categoryId}/${post.id}`}
                      className="group flex items-start gap-3 rounded-lg px-2.5 py-2.5 transition-colors hover:bg-[#f9fcf7]/60 dark:hover:bg-white/[0.02]"
                    >
                      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-[#4fae2e]/8 text-[11px] font-semibold text-[#4fae2e]/70">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-[13px] font-medium leading-snug text-foreground/80 transition-colors group-hover:text-[#4fae2e]">
                          {post.title}
                        </p>
                        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground/50">
                          <span className="inline-flex items-center gap-1">
                            <Heart className="size-3 text-[#4fae2e]/60" />
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

        {/* Post list */}
        <div
          className={`order-1 ${showTrending ? "lg:order-2 lg:col-span-8" : ""}`}
        >
          {pagination.total > 0 ? (
            <p className="mb-4 text-[13px] text-muted-foreground/50">
              Showing{" "}
              <span className="font-medium text-foreground/70">
                {Math.min((currentPage - 1) * limit + 1, pagination.total)}–
                {Math.min(currentPage * limit, pagination.total)}
              </span>{" "}
              of{" "}
              <span className="font-medium text-foreground/70">
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
              <div className="rounded-xl border border-dashed border-border/60 px-6 py-16 text-center">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#4fae2e]/8 text-[#4fae2e]">
                  <Inbox className="size-7" strokeWidth={1.5} />
                </div>
                <p className="text-lg font-medium text-foreground">
                  {isMyPosts
                    ? "You have no posts here"
                    : currentSearch
                      ? "No posts found"
                      : "No posts yet"}
                </p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground/60">
                  {isMyPosts
                    ? "Create a post to get started."
                    : currentSearch
                      ? `No results for "${currentSearch}". Try a different search.`
                      : "Be the first to create a post in this category."}
                </p>
                {hasActiveFilters ? (
                  <Button
                    size="sm"
                    className="mt-6 h-8 bg-[#4fae2e] text-[13px] text-white hover:bg-[#459928] dark:hover:bg-[#5bc03a]"
                    onClick={clearAllFilters}
                  >
                    Clear filters
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="space-y-2">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/forum/${categoryId}/${post.id}`}
                    className="group block rounded-xl border border-border/40 bg-background px-5 py-5 transition-all hover:border-[#4fae2e]/20 hover:bg-[#f9fcf7]/60 hover:shadow-sm sm:py-6 dark:hover:bg-white/[0.02]"
                  >
                    <h3 className="text-[15px] font-semibold tracking-tight text-foreground transition-colors group-hover:text-[#4fae2e] sm:text-base">
                      {post.title}
                    </h3>
                    <p className="mt-2 line-clamp-2 text-[13px] leading-relaxed text-muted-foreground/60">
                      {stripHtml(post.content)}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-muted-foreground/50">
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
                        <span className="font-medium text-foreground/70">
                          {post.user?.profile?.displayName ??
                            `User #${post.userId}`}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="size-3 text-[#4fae2e]/60" />
                        {formatDate(post.createdAt)}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Heart className="size-3 text-[#4fae2e]/60" />
                        {post.likeCount}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <MessageSquare className="size-3" />
                        {post.commentCount}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
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
