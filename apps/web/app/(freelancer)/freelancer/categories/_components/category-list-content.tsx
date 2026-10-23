"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  SearchX,
  Tag,
  X,
} from "@/components/icons";

import { Button } from "@repo/ui/components/shadcn/button";
import type { JobCategoryBrowseItemType } from "@shared/types";

type CategoryListContentProps = {
  initialCategories: JobCategoryBrowseItemType[];
  initialPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  initialSearch?: string;
};

/** UC-46.06 — danh sách danh mục công việc đang hoạt động (chỉ đọc). */
export function CategoryListContent({
  initialCategories,
  initialPagination,
  initialSearch = "",
}: CategoryListContentProps) {
  const router = useRouter();
  const t = useTranslations("jobCategories");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(initialSearch);

  const basePath = "/freelancer/categories";
  const categories = initialCategories ?? [];
  const pagination = initialPagination;

  useEffect(() => {
    setSearchInput(initialSearch);
  }, [initialSearch]);

  const pushWithParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams();
    if (initialSearch) params.set("search", initialSearch);
    if (pagination.page > 1) params.set("page", String(pagination.page));

    for (const [name, value] of Object.entries(updates)) {
      if (value === null || value === "") params.delete(name);
      else params.set(name, value);
    }

    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${basePath}?${query}` : basePath);
    });
  };

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    pushWithParams({ search: searchInput.trim() || null, page: null });
  };

  const goToPage = (page: number) => {
    pushWithParams({ page: page > 1 ? String(page) : null });
  };

  return (
    <div className="flex flex-1 flex-col bg-background font-sans">
      <section className="border-b border-border bg-background">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans sm:text-3xl">
                {t("listTitle")}
              </h1>
              <p className="mt-1 text-xs font-normal text-muted-foreground">
                {t("listSubtitle")}
              </p>
            </div>

            <span className="self-start rounded-full bg-[#F1F0F5] dark:bg-zinc-800 px-3.5 py-1 text-xs font-medium text-muted-foreground sm:self-auto">
              {t("listCount", { count: pagination.total })}
            </span>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative mt-4 max-w-md">
            <div className="relative flex items-center">
              <Search className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground" />
              <input
                type="text"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={t("searchPlaceholder")}
                className="h-10 w-full rounded-full bg-[#F3F3F7] dark:bg-zinc-800/90 pl-10 pr-9 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground border border-black/5 dark:border-white/10 outline-none focus:ring-2 focus:ring-[#4fae2e]/30 transition-all"
              />
              {searchInput ? (
                <button
                  type="button"
                  onClick={() => {
                    setSearchInput("");
                    pushWithParams({ search: null, page: null });
                  }}
                  className="absolute right-3 flex size-5 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                  title={t("clearSearch")}
                >
                  <X className="size-3" />
                </button>
              ) : null}
            </div>
          </form>
        </div>
      </section>

      <div className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        {isPending ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card/40 px-6 py-16 text-center font-sans"
          >
            <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-[#F1F0F5] dark:bg-zinc-800 text-muted-foreground">
              <SearchX className="size-6 text-muted-foreground" />
            </div>
            <p className="text-base font-semibold text-foreground">
              {t("emptyTitle")}
            </p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
              {t("emptyDescription")}
            </p>
          </motion.div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {categories.map((jobCategory, index) => (
              <motion.div
                key={jobCategory.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.03 }}
              >
                <Link
                  href={`${basePath}/${jobCategory.slug}`}
                  className="group flex h-full flex-col justify-between rounded-[28px] border border-border bg-card p-5 transition-all hover:border-[#4fae2e]/40 hover:bg-accent/10 shadow-xs sm:p-6"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <span className="flex size-10 items-center justify-center rounded-full bg-[#eaf8df] text-[#3f9225] dark:bg-[#4fae2e]/15 dark:text-[#7ad75d]">
                        <Tag className="size-4" />
                      </span>
                      <span className="rounded-full bg-[#F1F0F5] dark:bg-zinc-800 px-3 py-1 text-xs font-medium text-muted-foreground">
                        {t("jobsCount", { count: jobCategory.jobCount })}
                      </span>
                    </div>

                    <h2 className="mt-4 text-base font-bold text-foreground transition-colors line-clamp-1 group-hover:text-[#4fae2e]">
                      {jobCategory.name}
                    </h2>
                    <p className="mt-2 text-xs leading-relaxed text-muted-foreground line-clamp-3">
                      {jobCategory.description || t("noDescription")}
                    </p>
                  </div>

                  <span className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#4fae2e]">
                    {t("viewCategory")}
                    <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {!isPending && pagination.totalPages > 1 ? (
          <div className="mt-8 flex items-center justify-between border-t border-border pt-4 font-sans">
            <p className="font-sans text-xs text-muted-foreground">
              {tCommon("pageOf", {
                page: pagination.page,
                totalPages: pagination.totalPages,
              })}
            </p>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="size-8 rounded-full cursor-pointer"
                disabled={pagination.page <= 1}
                onClick={() => goToPage(pagination.page - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8 rounded-full cursor-pointer"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => goToPage(pagination.page + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
