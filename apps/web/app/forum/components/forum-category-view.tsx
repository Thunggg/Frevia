import { useTranslations } from "next-intl";
import Link from "next/link";
import { MessageSquare } from "@/components/icons";
import { LanguageSwitcher } from "@/components/language-switcher";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@repo/ui/components/shadcn/pagination";
import type {
  ForumCategoryListResponseType,
  ForumTopActiveUserListResponseType,
} from "@shared/types";

import { ForumCategorySearch } from "./forum-category-search";

type ForumCategoryViewProps = {
  categories: ForumCategoryListResponseType;
  mostActiveCategories: ForumCategoryListResponseType;
  topUsers: ForumTopActiveUserListResponseType;
  search: string;
  page: number;
  limit: number;
  total: number;
};

export function ForumCategoryView({
  categories,
  mostActiveCategories,
  topUsers,
  search,
  page,
  limit,
  total,
}: ForumCategoryViewProps) {
  const t = useTranslations("forum");
  const tCommon = useTranslations("common");
  const hasTopCategories = mostActiveCategories.length > 0;
  const hasTopUsers = topUsers.length > 0;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  const buildPageHref = (target: number) => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (target > 1) params.set("page", String(target));
    const qs = params.toString();
    return qs ? `/forum?${qs}` : "/forum";
  };

  const getPageNumbers = (): (number | "ellipsis")[] => {
    const pages: (number | "ellipsis")[] = [];

    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    pages.push(1);
    if (page > 3) pages.push("ellipsis");

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);
    for (let i = start; i <= end; i++) pages.push(i);

    if (page < totalPages - 2) pages.push("ellipsis");
    if (totalPages > 1) pages.push(totalPages);

    return pages;
  };

  return (
    <>
      {/* Hero */}
      <section className="border-b border-border/40 bg-background">
        <div className="w-full px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="flex items-center justify-between gap-4">
            <nav className="text-sm text-muted-foreground/60">
              <span className="font-medium text-foreground">
                {tCommon("forum")}
              </span>
            </nav>
            <LanguageSwitcher />
          </div>

          <div className="mt-5 max-w-2xl">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {t("title")}
            </h1>
            <p className="mt-2.5 text-[15px] leading-relaxed text-foreground/50 dark:text-foreground/60">
              {t("description")}
            </p>
          </div>
        </div>
      </section>

      {/* Content */}
      <div className="grid w-full gap-10 px-4 py-8 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-10">
        <section className="lg:col-span-8">
          {/* Search */}
          <ForumCategorySearch initialSearch={search} />

          {categories.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#0069D3]/10 text-[#0069D3]">
                <MessageSquare className="size-7" />
              </div>
              <p className="text-lg font-medium text-foreground">
                {search ? t("noCategoriesFoundTitle") : t("noCategoriesTitle")}
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                {search
                  ? t("noCategoriesFoundDescription")
                  : t("noCategoriesDescription")}
              </p>
              {search ? (
                <Button
                  asChild
                  className="mt-6 h-9 bg-[#0069D3] text-white hover:bg-blue-600"
                >
                  <Link href="/forum">{t("clearSearch")}</Link>
                </Button>
              ) : null}
            </div>
          ) : (
            <div className="divide-y divide-border border-y border-border">
              {categories.map((category) => (
                <Link
                  key={category.id}
                  href={`/forum/${category.slug}-${category.id}`}
                  className="group flex items-start gap-4 px-1 py-5 transition-colors hover:bg-[#0069D3]/5 sm:items-center sm:py-6 dark:hover:bg-white/[0.02]"
                >
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-[#0069D3]/10 text-[#0069D3]">
                    <MessageSquare className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-foreground transition-colors group-hover:text-[#0069D3]">
                        {category.name}
                      </h3>
                    </div>
                    <p className="mt-1 max-w-lg text-sm leading-relaxed text-muted-foreground line-clamp-2">
                      {category.description ?? t("noCategoryDescription")}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-semibold tabular-nums text-foreground/70">
                      {category.postCount}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {tCommon("posts", { count: category.postCount })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Result summary + pagination */}
          {total > 0 ? (
            <div className="mt-6 flex flex-col items-center justify-between gap-4 border-t border-border pt-4 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                {t("showing")}{" "}
                <span className="font-medium text-foreground/70">
                  {startItem}–{endItem}
                </span>{" "}
                {t("of")}{" "}
                <span className="font-medium text-foreground/70">{total}</span>{" "}
                {t("categories", { count: total })}
              </p>

              {totalPages > 1 ? (
                <Pagination className="mx-0 w-auto justify-end">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href={buildPageHref(Math.max(1, page - 1))}
                        label={tCommon("previous")}
                        ariaLabel={tCommon("previous")}
                        aria-disabled={page <= 1}
                        className={
                          page <= 1
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
                            href={buildPageHref(pageNum)}
                            isActive={pageNum === page}
                          >
                            {pageNum}
                          </PaginationLink>
                        </PaginationItem>
                      ),
                    )}

                    <PaginationItem>
                      <PaginationNext
                        href={buildPageHref(Math.min(totalPages, page + 1))}
                        label={tCommon("next")}
                        ariaLabel={tCommon("next")}
                        aria-disabled={page >= totalPages}
                        className={
                          page >= totalPages
                            ? "pointer-events-none opacity-50"
                            : undefined
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              ) : null}
            </div>
          ) : null}
        </section>

        <aside className="space-y-6 lg:col-span-4">
          {hasTopCategories ? (
            <section className="rounded-xl border border-border p-5 sm:p-6">
              <h2 className="text-sm font-semibold text-foreground">
                {t("mostActive")}
              </h2>
              <ul className="mt-4 divide-y divide-border">
                {mostActiveCategories.map((category) => (
                  <li key={category.id}>
                    <Link
                      href={`/forum/${category.slug}-${category.id}`}
                      className="group flex items-center justify-between py-3 transition-colors hover:text-[#0069D3]"
                    >
                      <p className="truncate text-sm font-medium text-foreground transition-colors group-hover:text-[#0069D3]">
                        {category.name}
                      </p>
                      <span className="ml-4 shrink-0 text-xs tabular-nums text-muted-foreground">
                        {category.postCount}{" "}
                        {tCommon("posts", { count: category.postCount })}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {hasTopUsers ? (
            <section className="rounded-xl border border-border p-5 sm:p-6">
              <h2 className="text-sm font-semibold text-foreground">
                {t("topContributors")}
              </h2>
              <ul className="mt-4 divide-y divide-border">
                {topUsers.map((user) => (
                  <li
                    key={user.id}
                    className="flex items-center justify-between gap-3 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <Avatar size="sm">
                        <AvatarImage
                          src={user.avatarUrl ?? undefined}
                          alt={user.displayName ?? t("member")}
                        />
                        <AvatarFallback>
                          {user.displayName?.charAt(0)?.toUpperCase() ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <p className="truncate text-sm font-medium text-foreground">
                        {user.displayName ?? t("anonymous")}
                      </p>
                    </div>
                    <span className="ml-4 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                      <span className="font-semibold text-foreground/70">
                        {user.postCount}
                      </span>{" "}
                      {tCommon("posts", { count: user.postCount })}
                      <span className="mx-1">·</span>
                      <span className="font-semibold text-foreground/70">
                        {user.commentCount}
                      </span>{" "}
                      {tCommon("comments", { count: user.commentCount })}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </aside>
      </div>
    </>
  );
}
