"use client";

import { useCallback, useState, useTransition } from "react";
import { useFormatter, useTranslations } from "next-intl";
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
} from "@/components/icons";

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

import { buildSlugId } from "@/lib/slug-utils";

import { CreatePostDialog } from "./create-post-dialog";

type ForumPostListProps = {
  posts: ForumPostWithUserType[];
  pagination: PaginationMeta;
  categoryId: number;
  categorySlug: string;
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

export function ForumPostList({
  posts,
  pagination,
  categoryId,
  categorySlug,
  categoryName,
  currentSearch,
  currentUserId,
  isMyPosts,
  topPosts,
}: ForumPostListProps) {
  const router = useRouter();
  const t = useTranslations("forum");
  const tCommon = useTranslations("common");
  const format = useFormatter();
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
        router.push(`/forum/${buildSlugId(categorySlug, categoryId)}?${params.toString()}`);
      });
    },
    [router, categoryId, categorySlug, limit],
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

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <form onSubmit={handleSearchSubmit} className="w-full max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground/50" strokeWidth={1.75} />
            <Input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="h-11 rounded-lg border-border bg-transparent pl-9 pr-9 text-sm focus:border-[#0069D3]/50 focus:ring-1 focus:ring-[#0069D3]/20"
            />
            {searchInput ? (
              <button
                type="button"
                onClick={clearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground/50 transition-colors hover:text-foreground"
                aria-label={t("clearSearch")}
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
              className={`h-11 w-28 gap-1.5 text-sm ${
                isMyPosts
                  ? "bg-[#0069D3] text-white hover:bg-blue-600"
                  : "border-border text-foreground/60 hover:border-[#0069D3]/40 hover:text-foreground"
              }`}
              onClick={toggleMyPosts}
              aria-pressed={isMyPosts}
            >
              <User className="size-4" />
              {t("myPosts")}
            </Button>
          ) : null}
          <CreatePostDialog
            categoryId={categoryId}
            categorySlug={categorySlug}
            categoryName={categoryName}
            currentUserId={currentUserId}
          />
          <Select value={String(limit)} onValueChange={handleLimitChange}>
            <SelectTrigger className="h-11 w-[120px] rounded-lg border-border bg-transparent text-sm text-foreground/60">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">{t("perPage", { count: 5 })}</SelectItem>
              <SelectItem value="10">{t("perPage", { count: 10 })}</SelectItem>
              <SelectItem value="20">{t("perPage", { count: 20 })}</SelectItem>
              <SelectItem value="50">{t("perPage", { count: 50 })}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filter chips */}
      {hasActiveFilters ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-muted-foreground/50">
            {t("filtersLabel")}
          </span>
          {currentSearch ? (
            <button
              type="button"
              onClick={clearSearch}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#0069D3]/20 bg-[#0069D3]/5 px-2.5 py-0.5 text-[12px] font-medium text-[#0069D3] transition-colors hover:border-[#0069D3]/40"
            >
              &quot;{currentSearch}&quot;
              <X className="size-3" />
            </button>
          ) : null}
          {isMyPosts ? (
            <button
              type="button"
              onClick={() => navigateToPage(1, searchInput, undefined, false)}
              className="inline-flex items-center gap-1.5 rounded-full border border-[#0069D3]/20 bg-[#0069D3]/5 px-2.5 py-0.5 text-[12px] font-medium text-[#0069D3] transition-colors hover:border-[#0069D3]/40"
            >
              {t("myPosts")}
              <X className="size-3" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={clearAllFilters}
            className="text-[12px] font-medium text-muted-foreground/50 transition-colors hover:text-[#0069D3]"
          >
            {t("clearAll")}
          </button>
        </div>
      ) : null}

      {/* Main grid */}
      <div className="grid gap-8 lg:grid-cols-12">
        {/* Trending sidebar */}
        <aside className="order-2 lg:order-1 lg:col-span-4">
          <div className="space-y-4 rounded-xl border border-border p-5 sm:p-6">
            <h2 className="text-base font-semibold text-foreground">
              {t("trendingIn", { category: categoryName })}
            </h2>
            {topPosts.length === 0 ? (
              <p className="text-sm text-muted-foreground/60">
                {t("noTrendingPosts")}
              </p>
            ) : (
              <ul className="space-y-1">
                {topPosts.map((post, index) => (
                  <li key={post.id}>
                    <Link
                      href={`/forum/${buildSlugId(categorySlug, post.categoryId ?? categoryId)}/${buildSlugId(post.slug, post.id)}`}
                      className="group flex items-start gap-3 rounded-lg px-1 py-2 transition-colors hover:bg-[#0069D3]/5 dark:hover:bg-white/[0.02]"
                    >
                      <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[#0069D3]/10 text-[11px] font-semibold text-[#0069D3]">
                        {index + 1}
                      </span>
                      <div className="min-w-0 flex-1 space-y-1.5">
                        <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground/80 transition-colors group-hover:text-[#0069D3]">
                          {post.title}
                        </p>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground/50">
                          <span className="inline-flex items-center gap-1">
                            <Heart className="size-3 text-[#0069D3]/60" />
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
            )}
          </div>
        </aside>

        {/* Post list */}
        <div className="order-1 lg:order-2 lg:col-span-8">
          {pagination.total > 0 ? (
            <p className="mb-4 text-sm text-muted-foreground/50">
              {t("showing")}{" "}
              <span className="font-medium text-foreground/70">
                {Math.min((currentPage - 1) * limit + 1, pagination.total)}–
                {Math.min(currentPage * limit, pagination.total)}
              </span>{" "}
              {t("of")}{" "}
              <span className="font-medium text-foreground/70">
                {pagination.total}
              </span>{" "}
              {tCommon("posts", { count: pagination.total })}
              {isMyPosts ? ` ${t("yours")}` : ""}
            </p>
          ) : null}

          <div
            className={`transition-opacity ${
              isPending ? "pointer-events-none opacity-50" : ""
            }`}
          >
            {posts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 px-6 py-16 text-center">
                <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#0069D3]/10 text-[#0069D3]">
                  <Inbox className="size-7" strokeWidth={1.5} />
                </div>
                <p className="text-lg font-medium text-foreground">
                  {isMyPosts
                    ? t("noPostsHere")
                    : currentSearch
                      ? t("noPostsFound")
                      : t("noPostsYet")}
                </p>
                <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground/60">
                  {isMyPosts
                    ? t("createToStart")
                    : currentSearch
                      ? t("noResultsFor", { query: currentSearch })
                      : t("beFirst")}
                </p>
                {hasActiveFilters ? (
                  <Button
                    size="sm"
                    className="mt-6 h-9 bg-[#0069D3] text-sm text-white hover:bg-blue-600 dark:hover:bg-blue-500"
                    onClick={clearAllFilters}
                  >
                    {t("clearFilters")}
                  </Button>
                ) : null}
              </div>
            ) : (
              <div className="divide-y divide-border border-y border-border">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/forum/${buildSlugId(categorySlug, categoryId)}/${buildSlugId(post.slug, post.id)}`}
                    className="group block space-y-3 px-3 py-6 transition-colors hover:bg-[#0069D3]/5 sm:px-5 sm:py-7 dark:hover:bg-white/[0.02]"
                  >
                    <h3 className="text-base font-semibold tracking-tight text-foreground transition-colors group-hover:text-[#0069D3]">
                      {post.title}
                    </h3>
                    <p className="line-clamp-2 text-sm leading-relaxed text-muted-foreground/60">
                      {stripHtml(post.content)}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-muted-foreground/50">
                      <span className="inline-flex items-center gap-2">
                        <Avatar>
                          <AvatarImage
                            src={
                              post.user?.profile?.avatarUrl ?? undefined
                            }
                            alt={
                              post.user?.profile?.displayName ??
                              t("userFallback", { id: post.userId })
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
                            t("userFallback", { id: post.userId })}
                        </span>
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Calendar className="size-3 text-[#0069D3]/60" />
                        {format.dateTime(new Date(post.createdAt), {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <Heart className="size-3 text-[#0069D3]/60" />
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
                      label={tCommon("previous")}
                      ariaLabel={tCommon("previous")}
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
                        <PaginationEllipsis label={tCommon("morePages")} />
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
                      label={tCommon("next")}
                      ariaLabel={tCommon("next")}
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
