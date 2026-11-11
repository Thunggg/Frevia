"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition, type FormEvent, type MouseEvent } from "react";
import {
  ArrowLeft,
  Bookmark,
  Search,
  SearchX,
  X,
} from "@/components/icons";
import jobApiRequest from "@/apiRequests/job";
import savedSearchApiRequest from "@/apiRequests/saved-search";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type {
  GetMeResType,
  JobCategoryBrowseItemType,
  JobType,
  SavedSearchType,
  ViewJobDetailResType,
  ViewListJobResponseType,
} from "@shared/types";
import { getBookmarkErrorMessage } from "@/lib/utils";
import { JobCard } from "../../../_components/job-card";
import { JobPagination } from "../../../_components/job-pagination";
import { SearchFiltersSidebar } from "../../../_components/search-filters-sidebar";
import { SaveSearchDialog } from "../../saved-searches/save-search-dialog";

type SearchJobsContentProps = {
  user: GetMeResType | null;
  initialJobs: JobType[];
  initialPagination: ViewListJobResponseType["pagination"];
  initialCategories: JobCategoryBrowseItemType[];
  initialBookmarkedSlugs: string[];
  initialBookmarkedJobs: ViewJobDetailResType[];
  initialSavedSearches: SavedSearchType[];
  initialQ?: string;
  initialCategory?: string;
  initialBudget?: string;
  initialBudgetMin?: string;
  initialBudgetMax?: string;
  initialTime?: string;
  initialHiringType?: string;
  initialSkill?: string;
  initialSort?: string;
};

export function SearchJobsContent({
  user,
  initialJobs,
  initialPagination,
  initialCategories,
  initialBookmarkedSlugs = [],
  initialBookmarkedJobs = [],
  initialSavedSearches = [],
  initialQ = "",
  initialCategory = "all",
  initialBudget = "all",
  initialBudgetMin = "",
  initialBudgetMax = "",
  initialTime = "all",
  initialHiringType = "all",
  initialSkill = "",
  initialSort = "newest",
}: SearchJobsContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("findWork");
  const tBookmark = useTranslations("bookmark");
  const [isPending, startTransition] = useTransition();

  const SORT_OPTIONS = [
    { value: "newest", label: t("sort.newest") },
    { value: "oldest", label: t("sort.oldest") },
    { value: "budget-high", label: t("sort.budgetHigh") },
    { value: "budget-low", label: t("sort.budgetLow") },
    { value: "title-asc", label: t("sort.titleAsc") },
    { value: "title-desc", label: t("sort.titleDesc") },
  ];

  const [searchInput, setSearchInput] = useState(initialQ);
  const [bookmarkedSlugs, setBookmarkedSlugs] = useState(
    () => new Set(initialBookmarkedSlugs),
  );
  const [, setBookmarkedJobs] = useState<ViewJobDetailResType[]>(
    () => initialBookmarkedJobs ?? [],
  );
  const [pendingBookmarkSlug, setPendingBookmarkSlug] = useState<string | null>(
    null,
  );
  const [savedSearches, setSavedSearches] = useState<SavedSearchType[]>(
    () => initialSavedSearches ?? [],
  );

  const canBookmark = Boolean(user);

  const updateFilters = (
    updates: Record<string, string | number | null | undefined>,
  ) => {
    const params = new URLSearchParams(searchParams.toString());

    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === undefined || value === "" || value === "all") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    }

    if (!("page" in updates)) {
      params.set("page", "1");
    }

    const query = params.toString();
    startTransition(() => {
      router.push(query ? `/freelancer/search/jobs?${query}` : "/freelancer/search/jobs");
    });
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateFilters({ q: searchInput.trim() || null });
  };

  const handleClearSearch = () => {
    setSearchInput("");
    updateFilters({ q: null });
  };

  const handleSortChange = (newSort: string) => {
    updateFilters({ sort: newSort });
  };

  const handlePageChange = (newPage: number) => {
    updateFilters({ page: String(newPage) });
  };

  const handlePageSizeChange = (newLimit: number) => {
    updateFilters({ limit: String(newLimit), page: "1" });
  };

  const handleClearAllFilters = () => {
    setSearchInput("");
    startTransition(() => {
      router.push("/freelancer/search/jobs");
    });
  };

  const toggleBookmark = async (slug: string, event?: MouseEvent) => {
    event?.preventDefault();
    event?.stopPropagation();

    if (!canBookmark) return;

    const isBookmarked = bookmarkedSlugs.has(slug);
    setPendingBookmarkSlug(slug);

    try {
      if (isBookmarked) {
        await jobApiRequest.removeBookmark(slug);
        setBookmarkedSlugs((current) => {
          const next = new Set(current);
          next.delete(slug);
          return next;
        });
        setBookmarkedJobs((current) =>
          current.filter((item) => item.slug !== slug),
        );
        toastSuccess({ message: tBookmark("removed") });
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("frevia:bookmark-updated", {
              detail: { slug, isBookmarked: false },
            }),
          );
        }
      } else {
        await jobApiRequest.bookmarkJob(slug);
        setBookmarkedSlugs((current) => new Set(current).add(slug));
        const addedJob = initialJobs.find((j) => j.slug === slug);
        if (addedJob) {
          setBookmarkedJobs((current) => [
            addedJob as unknown as ViewJobDetailResType,
            ...current,
          ]);
        }
        toastSuccess({ message: tBookmark("added") });
        if (typeof window !== "undefined") {
          window.dispatchEvent(
            new CustomEvent("frevia:bookmark-updated", {
              detail: { slug, isBookmarked: true },
            }),
          );
        }
      }
    } catch (error) {
      toastError({
        message: getBookmarkErrorMessage(error, tBookmark, isBookmarked),
      });
    } finally {
      setPendingBookmarkSlug(null);
    }
  };

  const handleApplySavedSearch = (savedSearch: SavedSearchType) => {
    const nextParams = new URLSearchParams();
    const sp = (savedSearch.searchParams ?? {}) as Record<string, unknown>;

    if (sp.q || sp.keyword) {
      nextParams.set("q", String(sp.q || sp.keyword));
      setSearchInput(String(sp.q || sp.keyword));
    }
    if (sp.category) nextParams.set("category", String(sp.category));
    if (sp.budget) nextParams.set("budget", String(sp.budget));
    if (sp.budgetMin) nextParams.set("budgetMin", String(sp.budgetMin));
    if (sp.budgetMax) nextParams.set("budgetMax", String(sp.budgetMax));
    if (sp.time) nextParams.set("time", String(sp.time));
    if (sp.hiringType) nextParams.set("hiringType", String(sp.hiringType));
    if (sp.skill) nextParams.set("skill", String(sp.skill));
    if (sp.sort) nextParams.set("sort", String(sp.sort));

    const qs = nextParams.toString();
    startTransition(() => {
      router.push(qs ? `/freelancer/search/jobs?${qs}` : "/freelancer/search/jobs");
    });
  };

  const activeCategory = initialCategories.find(
    (c) => c.slug === initialCategory,
  );

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans space-y-6">
      {/* 1. Header with Breadcrumb & Search Input (Image 2 style) */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link
            href="/freelancer/find-work/best-matches"
            className="hover:text-foreground transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft className="size-3.5" />
            <span>{t("searchPage.breadcrumbHome")}</span>
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium">
            {t("searchPage.breadcrumbSearch")}
          </span>
        </div>

        {/* Big Search Form */}
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <div className="relative flex items-center">
            <Search className="absolute left-4 size-5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t("searchPage.searchPlaceholder")}
              className="h-12 w-full rounded-full border border-border bg-card pl-12 pr-32 text-sm sm:text-base font-medium text-foreground placeholder:text-muted-foreground shadow-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
            />
            {searchInput && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-24 p-1 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                title={t("searchPage.clearSearch")}
              >
                <X className="size-4" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 text-xs sm:text-sm font-semibold shadow-xs transition-colors cursor-pointer"
            >
              {t("searchPage.search")}
            </button>
          </div>
        </form>
      </div>

      {/* 2. Top Toolbar Bar (Save Search & Sort by) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 pb-3 border-b border-border">
        {/* Left: Save search and saved searches */}
        <div className="flex items-center gap-2">
          <SaveSearchDialog
            searchParams={Object.fromEntries(searchParams.entries())}
            savedSearches={savedSearches}
            onApply={handleApplySavedSearch}
            onChanged={() => {
              void savedSearchApiRequest
                .getSavedSearches()
                .then((res: { data?: SavedSearchType[] }) => setSavedSearches(res.data ?? []));
            }}
          />
          <Link
            href="/freelancer/find-work/saved-searches"
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
          >
            <Bookmark className="size-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>
              {t("searchPage.savedSearches", { count: savedSearches.length })}
            </span>
          </Link>
        </div>

        {/* Right: Results count & Sort by */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {t("searchPage.totalJobs", { count: initialPagination.total })}
          </span>

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-muted-foreground hidden md:inline">
              {t("searchPage.sortBy")}
            </span>
            <Select value={initialSort} onValueChange={handleSortChange}>
              <SelectTrigger className="h-9 w-44 rounded-xl border border-border bg-card text-xs font-medium">
                <SelectValue placeholder={t("searchPage.sortBy")} />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-border bg-card p-1 shadow-xl">
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem
                    key={opt.value}
                    value={opt.value}
                    className="rounded-lg text-xs cursor-pointer"
                  >
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 3. Main Content: Filter Sidebar on Left, Job List on Right */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Filter Sidebar */}
        <SearchFiltersSidebar
          categories={initialCategories}
          selectedCategory={initialCategory}
          selectedBudget={initialBudget}
          selectedBudgetMin={initialBudgetMin}
          selectedBudgetMax={initialBudgetMax}
          selectedTime={initialTime}
          selectedHiringType={initialHiringType}
          selectedSkill={initialSkill}
          onFilterChange={(key: string, val: string | null) => updateFilters({ [key]: val })}
          onClearFilters={handleClearAllFilters}
        />

        {/* Right Column: Search Results */}
        <main className="flex-1 min-w-0 w-full space-y-4">
          {/* Active Filter Badges */}
          {(initialQ ||
            (initialCategory && initialCategory !== "all") ||
            (initialBudget && initialBudget !== "all") ||
            initialBudgetMin ||
            initialBudgetMax ||
            (initialTime && initialTime !== "all") ||
            (initialHiringType && initialHiringType !== "all") ||
            initialSkill) && (
            <div className="flex flex-wrap items-center gap-1.5 pb-2">
              <span className="text-xs text-muted-foreground mr-1">
                {t("filters")}:
              </span>
              {initialQ && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-xs font-medium">
                  {t("chip.search", { value: initialQ })}
                  <button
                    type="button"
                    onClick={() => updateFilters({ q: null })}
                    className="hover:opacity-70 cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
              {activeCategory && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                  {t("chip.category", { value: activeCategory.name })}
                  <button
                    type="button"
                    onClick={() => updateFilters({ category: null })}
                    className="hover:opacity-70 cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
              {initialBudget && initialBudget !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                  {t("chip.budget", { value: initialBudget })}
                  <button
                    type="button"
                    onClick={() => updateFilters({ budget: null })}
                    className="hover:opacity-70 cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
              {(initialBudgetMin || initialBudgetMax) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                  ${initialBudgetMin || 0} – ${initialBudgetMax || "∞"}
                  <button
                    type="button"
                    onClick={() =>
                      updateFilters({ budgetMin: null, budgetMax: null })
                    }
                    className="hover:opacity-70 cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
              {initialHiringType && initialHiringType !== "all" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                  {initialHiringType === "SINGLE"
                    ? t("modal.hiringTypeSingle")
                    : t("modal.hiringTypeMultiple")}
                  <button
                    type="button"
                    onClick={() => updateFilters({ hiringType: null })}
                    className="hover:opacity-70 cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
              {initialSkill && (
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-foreground">
                  {t("chip.search", { value: initialSkill })}
                  <button
                    type="button"
                    onClick={() => updateFilters({ skill: null })}
                    className="hover:opacity-70 cursor-pointer"
                  >
                    <X className="size-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Job List / Loading / Empty */}
          {isPending ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-border bg-card p-5 space-y-3"
                >
                  <Skeleton className="h-4 w-32 rounded-full" />
                  <Skeleton className="h-6 w-3/4 rounded-md" />
                  <Skeleton className="h-4 w-1/3 rounded-md" />
                  <Skeleton className="h-4 w-full rounded-md" />
                  <div className="flex items-center gap-2 pt-2">
                    <Skeleton className="h-6 w-16 rounded-full" />
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : initialJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center">
              <SearchX className="size-12 text-muted-foreground mb-3" />
              <h3 className="text-base font-semibold text-foreground">
                {t("searchPage.noJobsTitle")}
              </h3>
              <p className="mt-1 max-w-md text-xs text-muted-foreground leading-relaxed">
                {t("searchPage.noJobsDesc")}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearAllFilters}
                className="mt-4 rounded-full text-xs font-semibold"
              >
                {t("searchPage.clearAll")}
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {initialJobs.map((job, index) => (
                <JobCard
                  key={job.id}
                  job={job}
                  index={index}
                  jobBaseUrl="/freelancer/jobs"
                  filterBasePath="/freelancer/search/jobs"
                  canBookmark={canBookmark}
                  isBookmarked={bookmarkedSlugs.has(job.slug)}
                  isBookmarkPending={pendingBookmarkSlug === job.slug}
                  onToggleBookmark={toggleBookmark}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isPending && initialJobs.length > 0 && (
            <JobPagination
              currentPage={initialPagination.page}
              totalPages={initialPagination.totalPages}
              totalResults={initialPagination.total}
              pageSize={initialPagination.limit}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              isLoading={isPending}
            />
          )}
        </main>
      </div>
    </div>
  );
}
