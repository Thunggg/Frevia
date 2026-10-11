"use client";

import { useState, useCallback, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
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
  MessageSquare,
  Inbox,
  User,
  ChevronRight,
} from "lucide-react";
import type {
  ForumPostWithUserType,
  PaginationMeta,
  ForumTopPostType,
} from "@shared/types";
import { CreatePostDialog } from "./create-post-dialog";

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .trim();
}

function formatRelativeTime(date: string | Date): string {
  const then = new Date(date).getTime();
  const minutes = Math.floor((Date.now() - then) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <form onSubmit={handleSearchSubmit} className="relative w-full max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search posts..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="h-9 rounded-lg pl-9"
          />
        </form>

        <div className="flex items-center gap-2 sm:ml-auto">
          {currentUserId && (
            <Button
              variant={isMyPosts ? "default" : "outline"}
              size="sm"
              className="h-9 gap-1.5"
              onClick={toggleMyPosts}
            >
              <User className="h-3.5 w-3.5" />
              My posts
            </Button>
          )}
          <CreatePostDialog
            categoryId={categoryId}
            categoryName={categoryName}
          />
          <Select value={String(limit)} onValueChange={handleLimitChange}>
            <SelectTrigger className="h-9 w-[110px]">
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

      {/* Grid: Post list + Trending sidebar */}
      <div
        className={`grid gap-8 ${showTrending ? "grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px]" : "grid-cols-1"}`}
      >
        {/* Post List */}
        <div className="min-w-0">
          {pagination.total > 0 && (
            <p className="mb-4 text-xs text-muted-foreground">
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
              {isMyPosts && " · your posts only"}
            </p>
          )}

          <div
            className={`transition-opacity ${isPending ? "pointer-events-none opacity-50" : ""}`}
          >
            {posts.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed bg-card py-16">
                <Inbox className="mb-3 h-7 w-7 text-muted-foreground/60" />
                <p className="text-sm font-medium text-foreground">
                  {isMyPosts
                    ? "You have no posts here"
                    : currentSearch
                      ? "No posts found"
                      : "No posts yet"}
                </p>
                <p className="mt-1 max-w-sm text-center text-sm text-muted-foreground">
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
              </div>
            ) : (
              <ol className="divide-y divide-border overflow-hidden rounded-lg border bg-card">
                {posts.map((post) => (
                  <li key={post.id} className="list-none">
                    <Link
                      href={`/forum/${categoryId}/${post.id}`}
                      className="group flex items-start gap-4 p-4 transition-colors hover:bg-muted/50 sm:p-5"
                    >
                      <Avatar>
                        <AvatarImage
                          src={post.user?.profile?.avatarUrl ?? undefined}
                          alt={
                            post.user?.profile?.displayName ??
                            `User #${post.userId}`
                          }
                        />
                        <AvatarFallback className="text-xs">
                          {post.user?.profile?.displayName
                            ?.charAt(0)
                            ?.toUpperCase() ?? "?"}
                        </AvatarFallback>
                      </Avatar>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-[15px] font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
                          {post.title}
                          <span className="ml-1.5 align-middle text-xs font-normal tabular-nums text-muted-foreground">
                            #{post.id}
                          </span>
                        </h3>
                        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                          {stripHtml(post.content)}
                        </p>
                        <div className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <span className="font-medium text-foreground/80">
                            {post.user?.profile?.displayName ??
                              `User #${post.userId}`}
                          </span>
                          <span aria-hidden="true">&middot;</span>
                          <time dateTime={new Date(post.createdAt).toISOString()}>
                            {formatRelativeTime(post.createdAt)}
                          </time>
                        </div>
                      </div>

                      <ChevronRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground/40 opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ol>
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

        {/* Trending sidebar */}
        {showTrending && (
          <aside>
            <div className="sticky top-24">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Trending this week
              </h2>

              <ol className="divide-y divide-border rounded-lg border bg-card">
                {topPosts.map((post, index) => (
                  <li key={post.id}>
                    <Link
                      href={`/forum/${categoryId}/${post.id}`}
                      className="group flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50"
                    >
                      <span className="w-4 shrink-0 pt-0.5 text-right text-xs font-semibold tabular-nums text-muted-foreground">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-[13px] font-medium leading-snug text-foreground transition-colors group-hover:text-primary">
                          {post.title}
                        </p>
                        <div className="mt-1 flex items-center gap-2.5 text-[11px] text-muted-foreground">
                          <span className="inline-flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            {post.commentCount}
                          </span>
                          <span>{formatRelativeTime(post.createdAt)}</span>
                        </div>
                      </div>
                    </Link>
                  </li>
                ))}
              </ol>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
