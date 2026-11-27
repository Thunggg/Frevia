"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent } from "react";
import { ArrowLeft, Loader2, Search, SearchX, X } from "@/components/icons";

import { Button } from "@repo/ui/components/shadcn/button";
import type { ViewJobCategoryDetailResponseType } from "@shared/types";
import { JobCard } from "../../../_components/job-card";
import { JobPagination } from "../../../_components/job-pagination";

type CategoryDetailContentProps = {
  jobCategory: ViewJobCategoryDetailResponseType;
  initialSearch?: string;
};

const JOB_BASE_URL = "/freelancer/jobs";
const FIND_WORK_PATH = "/freelancer/search/jobs";
const CATEGORY_BASE_PATH = "/freelancer/categories";

/** UC-46.07 — chi tiết danh mục kèm tìm kiếm công việc đang mở thuộc danh mục. */
export function CategoryDetailContent({
  jobCategory,
  initialSearch = "",
}: CategoryDetailContentProps) {
  const router = useRouter();
  const t = useTranslations("jobCategories");
  const [isPending, startTransition] = useTransition();
  const [searchInput, setSearchInput] = useState(initialSearch);

  useEffect(() => {
    setSearchInput(initialSearch);
  }, [initialSearch]);

  const jobs = jobCategory.jobs ?? [];
  const pagination = jobCategory.pagination;

  const pushWithParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams();
    if (initialSearch) params.set("search", initialSearch);
    if (pagination.page > 1) params.set("page", String(pagination.page));
    if (pagination.limit !== 10) params.set("limit", String(pagination.limit));

    for (const [name, value] of Object.entries(updates)) {
      if (value === null || value === "") params.delete(name);
      else params.set(name, value);
    }

    const query = params.toString();
    startTransition(() => {
      router.push(
        query
          ? `${CATEGORY_BASE_PATH}/${jobCategory.slug}?${query}`
          : `${CATEGORY_BASE_PATH}/${jobCategory.slug}`,
      );
    });
  };

  const handleSearchSubmit = (event: FormEvent) => {
    event.preventDefault();
    pushWithParams({ search: searchInput.trim() || null, page: null });
  };

  const handleClearSearch = () => {
    setSearchInput("");
    pushWithParams({ search: null, page: null });
  };

  const goToPage = (page: number) => {
    pushWithParams({ page: page > 1 ? String(page) : null });
  };

  const handlePageSizeChange = (limit: number) => {
    pushWithParams({ limit: limit === 20 ? "20" : null, page: null });
  };

  return (
    <div className="flex flex-1 flex-col bg-background font-sans pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex min-w-0 items-center gap-2 text-xs text-muted-foreground">
          <Link
            href={CATEGORY_BASE_PATH}
            className="hover:text-foreground font-medium"
          >
            {t("allCategories")}
          </Link>
          <span className="text-muted-foreground/40">/</span>
          <span className="truncate font-medium text-foreground">
            {jobCategory.name}
          </span>
        </nav>

        {/* Category Info Card */}
        <section className="mt-4 rounded-xl border border-border bg-card p-5 sm:p-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="font-semibold text-[#0069D3] dark:text-blue-400">
                  {t("categoryBadge")}
                </span>
                <span className="text-muted-foreground/40">•</span>
                <span>{t("jobsCount", { count: jobCategory.jobCount })}</span>
              </div>

              <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {jobCategory.name}
              </h1>
              <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted-foreground">
                {jobCategory.description || t("noDescription")}
              </p>
            </div>

            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-9 rounded-lg px-3.5 text-xs font-medium"
              >
                <Link href={CATEGORY_BASE_PATH}>
                  <ArrowLeft className="mr-1.5 size-3.5" />
                  <span>{t("backToCategories")}</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Search Jobs Inside Category */}
          <form
            onSubmit={handleSearchSubmit}
            className="mt-5 pt-5 border-t border-border"
          >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="relative flex flex-1 items-center">
                <Search className="pointer-events-none absolute left-3 size-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder={t("detailSearchPlaceholder")}
                  className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-8 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-[#0069D3]"
                />
                {searchInput ? (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-2.5 flex size-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                    title={t("clearSearch")}
                  >
                    <X className="size-3.5" />
                  </button>
                ) : null}
              </div>

              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="h-9 rounded-lg bg-[#0069D3] hover:bg-[#005bb8] text-white px-4 text-xs font-medium shrink-0 cursor-pointer"
              >
                {isPending ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <Search className="mr-1.5 size-3.5" />
                )}
                <span>{t("searchButton")}</span>
              </Button>
            </div>
          </form>
        </section>

        {/* Jobs Section */}
        <section className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
              {t("detailJobsTitle")}
            </h2>
            <span className="text-xs text-muted-foreground">
              {t("jobsCount", { count: pagination.total })}
            </span>
          </div>

          {isPending ? (
            <div className="flex items-center justify-center rounded-xl border border-border bg-card py-16">
              <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-card px-6 py-16 text-center font-sans">
              <div className="mb-3 flex size-11 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <SearchX className="size-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-semibold text-foreground">
                {initialSearch
                  ? t("detailSearchEmptyTitle")
                  : t("detailEmptyTitle")}
              </p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                {initialSearch
                  ? t("detailSearchEmptyDescription")
                  : t("detailEmptyDescription")}
              </p>
              {initialSearch ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleClearSearch}
                  className="mt-4 rounded-lg text-xs cursor-pointer"
                >
                  {t("clearSearch")}
                </Button>
              ) : (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="mt-4 rounded-lg text-xs"
                >
                  <Link href={FIND_WORK_PATH}>{t("browseAllJobs")}</Link>
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job, index) => (
                <JobCard
                  key={job.id}
                  job={job}
                  index={index}
                  jobBaseUrl={JOB_BASE_URL}
                  filterBasePath={FIND_WORK_PATH}
                />
              ))}
            </div>
          )}

          <JobPagination
            currentPage={pagination.page}
            totalPages={pagination.totalPages}
            totalResults={pagination.total}
            pageSize={pagination.limit}
            onPageChange={goToPage}
            onPageSizeChange={handlePageSizeChange}
            isLoading={isPending}
          />
        </section>
      </div>
    </div>
  );
}
