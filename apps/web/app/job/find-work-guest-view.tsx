"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Button } from "@repo/ui/components/shadcn/button";
import { Input } from "@repo/ui/components/shadcn/input";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@repo/ui/components/shadcn/pagination";
import type {
  JobCategoryBrowseItemType,
  ViewListJobResponseType,
} from "@shared/types";
import { Search, Briefcase, Filter, X } from "lucide-react";
import { JobCard } from "../(freelancer)/_components/job-card";

type FindWorkGuestViewProps = {
  initialData: ViewListJobResponseType | null;
  categories: JobCategoryBrowseItemType[];
  currentKeyword: string;
  currentCategory: string;
  currentBudget: string;
  currentSort: string;
  currentPage: number;
};

export function FindWorkGuestView({
  initialData,
  categories,
  currentKeyword,
  currentCategory,
  currentBudget,
  currentSort,
  currentPage,
}: FindWorkGuestViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const t = useTranslations("findWork");

  const [search, setSearch] = useState(currentKeyword);
  const [selectedCategory, setSelectedCategory] = useState(currentCategory);
  const [selectedBudget, setSelectedBudget] = useState(currentBudget);
  const [selectedSort, setSelectedSort] = useState(currentSort);

  const jobs = initialData?.data ?? [];
  const pagination = initialData?.pagination;
  const total = pagination?.total ?? 0;
  const totalPages = pagination?.totalPages ?? 1;

  const handleFilter = (updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, val]) => {
      if (val) {
        params.set(key, val);
      } else {
        params.delete(key);
      }
    });
    params.set("page", "1");

    startTransition(() => {
      router.push(`/job?${params.toString()}`);
    });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleFilter({
      keyword: search.trim(),
      category: selectedCategory,
      budget: selectedBudget,
      sort: selectedSort,
    });
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    startTransition(() => {
      router.push(`/job?${params.toString()}`);
    });
  };

  const handleGuestBookmark = () => {
    const currentPath =
      typeof window !== "undefined"
        ? window.location.pathname + window.location.search
        : "/job";
    router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
  };

  const activeCategoryObj = categories.find((c) => c.slug === currentCategory);

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role="GUEST" />

      <main className="flex-1 pb-16 pt-6">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Top Integrated Toolbar: Search & Find Work & Total Jobs on the Left, Filters & Sort on the Right */}
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Left: Search input, Find Work button, and Showing X jobs */}
            <form
              onSubmit={handleSearchSubmit}
              className="flex flex-1 flex-wrap items-center gap-3 sm:flex-nowrap"
            >
              <div className="relative min-w-[220px] max-w-md flex-1">
                <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t("searchPlaceholderGuest")}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="h-10 rounded-xl border-border bg-background pl-10 pr-4 text-xs sm:text-sm focus-visible:ring-1 focus-visible:ring-[#0069D3]"
                />
              </div>

              <Button
                type="submit"
                className="h-10 rounded-xl bg-[#0069D3] px-5 text-xs sm:text-sm font-semibold text-white shadow-xs hover:bg-[#005bb8] cursor-pointer shrink-0"
              >
                {t("findWorkBtn")}
              </Button>

              <span className="whitespace-nowrap text-xs sm:text-sm font-medium text-muted-foreground pl-1">
                {t("showingJobsCount", { count: total })}
              </span>
            </form>

            {/* Right: Filters (Category, Budget) next to Sort by */}
            <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center shrink-0">
              {/* Category Select Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  handleFilter({ category: e.target.value });
                }}
                className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-medium text-foreground cursor-pointer focus:outline-hidden"
              >
                <option value="">{t("allCategories")}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name} ({cat.jobCount})
                  </option>
                ))}
              </select>

              {/* Budget Select Filter */}
              <select
                value={selectedBudget}
                onChange={(e) => {
                  setSelectedBudget(e.target.value);
                  handleFilter({ budget: e.target.value });
                }}
                className="h-10 rounded-xl border border-border bg-background px-3 text-xs font-medium text-foreground cursor-pointer focus:outline-hidden"
              >
                <option value="">{t("allBudgets")}</option>
                <option value="under-500">{t("under500")}</option>
                <option value="500-1000">{t("500to1000")}</option>
                <option value="1000-5000">{t("1000to5000")}</option>
                <option value="5000-plus">{t("over5000")}</option>
              </select>

              {/* Sort by */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground pl-1">
                <span className="hidden sm:inline">{t("sortByLabel")}</span>
                <select
                  value={selectedSort}
                  onChange={(e) => {
                    setSelectedSort(e.target.value);
                    handleFilter({ sort: e.target.value });
                  }}
                  className="h-10 rounded-xl border border-border bg-background px-2.5 text-xs font-medium text-foreground cursor-pointer focus:outline-hidden"
                >
                  <option value="newest">{t("newest")}</option>
                  <option value="oldest">{t("oldest")}</option>
                  <option value="budget-high">{t("budgetHigh")}</option>
                  <option value="budget-low">{t("budgetLow")}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter Pill if active */}
          {(currentCategory || currentKeyword || currentBudget) && (
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="text-xs text-muted-foreground">{t("filterBy")}</span>
              {currentCategory && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#0069D3] dark:border-blue-900 dark:bg-blue-950/50 dark:text-blue-300">
                  <Filter className="size-3" />
                  {activeCategoryObj?.name || currentCategory}
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory("");
                      handleFilter({ category: "" });
                    }}
                    className="ml-1 rounded-full p-0.5 hover:bg-blue-200/50 cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
              {currentKeyword && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-zinc-300 bg-zinc-100 px-3 py-1 text-xs font-medium text-foreground dark:border-zinc-700 dark:bg-zinc-800">
                  &quot;{currentKeyword}&quot;
                  <button
                    type="button"
                    onClick={() => {
                      setSearch("");
                      handleFilter({ keyword: "" });
                    }}
                    className="ml-1 rounded-full p-0.5 hover:bg-zinc-200 dark:hover:bg-zinc-700 cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                onClick={() => {
                  setSearch("");
                  setSelectedCategory("");
                  setSelectedBudget("");
                  router.push("/job");
                }}
              >
                {t("clearAllFilters")}
              </Button>
            </div>
          )}

          {/* Content area: Job Cards */}
          <div className="w-full space-y-4">
            {jobs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-white p-12 text-center dark:bg-zinc-900">
                <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  <Briefcase className="size-6" />
                </div>
                <h3 className="text-base font-semibold text-foreground">
                  {t("emptyTitle")}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("emptyDescription")}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-4 rounded-full text-xs cursor-pointer"
                  onClick={() => {
                    setSearch("");
                    setSelectedCategory("");
                    setSelectedBudget("");
                    router.push("/job");
                  }}
                >
                  {t("clearAllFilters")}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job, idx) => (
                  <JobCard
                    key={job.id}
                    job={job}
                    index={idx}
                    jobBaseUrl="/job"
                    filterBasePath="/job"
                    canBookmark={true}
                    onToggleBookmark={handleGuestBookmark}
                    showApplyButton={true}
                  />
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 ? (
              <div className="pt-6">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage > 1) handlePageChange(currentPage - 1);
                        }}
                        className={
                          currentPage <= 1
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                    {Array.from({ length: totalPages }).map((_, idx) => {
                      const pageNum = idx + 1;
                      if (
                        pageNum === 1 ||
                        pageNum === totalPages ||
                        (pageNum >= currentPage - 1 &&
                          pageNum <= currentPage + 1)
                      ) {
                        return (
                          <PaginationItem key={pageNum}>
                            <PaginationLink
                              href="#"
                              isActive={pageNum === currentPage}
                              onClick={(e) => {
                                e.preventDefault();
                                handlePageChange(pageNum);
                              }}
                              className="cursor-pointer"
                            >
                              {pageNum}
                            </PaginationLink>
                          </PaginationItem>
                        );
                      }
                      return null;
                    })}
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          if (currentPage < totalPages)
                            handlePageChange(currentPage + 1);
                        }}
                        className={
                          currentPage >= totalPages
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            ) : null}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
