"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent, type MouseEvent } from "react";
import { motion } from "motion/react";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  SearchX,
  SlidersHorizontal,
  X,
} from "@/components/icons";

import jobApiRequest from "@/apiRequests/job";
import { Footer } from "@/components/footer";
import { Header, type UserRole } from "@/components/header";
import { BannerSlot } from "@/components/banner-slot";
import {
  BUDGET_KEYS,
  SORT_KEYS,
  TIME_KEYS,
  translateFilterOption,
} from "@/lib/search-filter-labels";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@repo/ui/components/shadcn/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@repo/ui/components/shadcn/sheet";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type {
  JobCategoryBrowseItemType,
  SavedSearchType,
  ViewListJobResponseType,
} from "@shared/types";
import { SaveSearchDialog } from "../saved-searches/save-search-dialog";
import { JobCard } from "../_components/job-card";

type FindWorkContentProps = {
  role: UserRole;
  initialJobs: ViewListJobResponseType["data"];
  initialPagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  initialKeyword?: string;
  initialCategory?: string;
  initialBudget?: string;
  initialTime?: string;
  initialSort?: string;
  initialBookmarkedSlugs?: string[];
  initialSavedSearches?: SavedSearchType[];
  initialCategories?: JobCategoryBrowseItemType[];
  embedded?: boolean;
  basePath?: string;
};

// Ánh xạ giá trị filter trên URL sang key dịch trong namespace "findWork"
// được chia sẻ với trang saved searches — xem lib/search-filter-labels.ts

function JobListSkeleton() {
  return (
    <div className="space-y-4 font-sans" aria-hidden>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-[28px] border border-border bg-card p-5 sm:p-6 space-y-3.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="size-9 rounded-full" />
          </div>
          <Skeleton className="h-6 w-3/4 rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
          <Skeleton className="h-4 w-5/6 rounded-md" />
          <div className="flex items-center justify-between pt-2">
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16 rounded-full" />
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-14 rounded-full" />
            </div>
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FindWorkContent({
  role,
  initialJobs,
  initialPagination,
  initialKeyword = "",
  initialCategory = "all",
  initialBudget = "all",
  initialTime = "all",
  initialSort = "newest",
  initialBookmarkedSlugs = [],
  initialSavedSearches = [],
  initialCategories = [],
  embedded = false,
  basePath,
}: FindWorkContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("findWork");
  const tBookmark = useTranslations("bookmark");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [searchInput, setSearchInput] = useState(initialKeyword);
  const [bookmarkedSlugs, setBookmarkedSlugs] = useState(
    () => new Set(initialBookmarkedSlugs),
  );
  const [pendingBookmarkSlug, setPendingBookmarkSlug] = useState<string | null>(
    null,
  );
  const [savedSearches, setSavedSearches] = useState(
    initialSavedSearches ?? [],
  );

  const effectiveBasePath =
    basePath ?? (embedded ? "/freelancer/find-work" : "/find-work");
  const jobBaseUrl = embedded ? "/freelancer/jobs" : "/job";

  useEffect(() => {
    setBookmarkedSlugs(new Set(initialBookmarkedSlugs));
  }, [initialBookmarkedSlugs]);

  useEffect(() => {
    setSavedSearches(initialSavedSearches ?? []);
  }, [initialSavedSearches]);

  useEffect(() => {
    setSearchInput(initialKeyword);
  }, [initialKeyword]);

  const jobs = initialJobs ?? [];
  const pagination = initialPagination ?? {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  };
  const canBookmark = role === "FREELANCER";
  const currentSearchParams = Object.fromEntries(
    Array.from(searchParams.entries()).filter(([, value]) => value !== ""),
  );

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    for (const [name, value] of Object.entries(updates)) {
      if (value === null || value === "" || value === "all") {
        params.delete(name);
      } else {
        params.set(name, value);
      }
    }

    if (!("page" in updates)) {
      params.set("page", "1");
    }

    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${effectiveBasePath}?${query}` : effectiveBasePath);
    });
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateParams({ keyword: searchInput.trim() || null });
  };

  const updateFilter = (
    name: "category" | "budget" | "time" | "sort",
    value: string,
  ) => {
    updateParams({ [name]: value });
    setFiltersOpen(false);
  };

  const goToPage = (page: number) => {
    updateParams({ page: String(page) });
  };

  const clearAllFilters = () => {
    setSearchInput("");
    startTransition(() => {
      router.push(effectiveBasePath);
    });
  };

  const applySavedSearch = (savedSearch: SavedSearchType) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(savedSearch.searchParams)) {
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        params.set(key, String(value));
      }
    }

    const query = params.toString();
    startTransition(() => {
      router.push(query ? `${effectiveBasePath}?${query}` : effectiveBasePath);
    });
  };

  const toggleBookmark = async (slug: string, event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!canBookmark || pendingBookmarkSlug) return;

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
        toastSuccess({ message: tBookmark("removed") });
      } else {
        await jobApiRequest.bookmarkJob(slug);
        setBookmarkedSlugs((current) => new Set(current).add(slug));
        toastSuccess({ message: tBookmark("added") });
      }
    } catch {
      toastError({
        message: isBookmarked
          ? tBookmark("removeFailed")
          : tBookmark("updateFailed"),
      });
    } finally {
      setPendingBookmarkSlug(null);
    }
  };

  const translateOption = (keys: Record<string, string>, value: string) =>
    translateFilterOption(t, keys, value);

  const selectedCategory = initialCategories.find(
    (category) => category.slug === initialCategory,
  );

  const activeChips = [
    initialKeyword
      ? {
          key: "keyword",
          label: t("chip.search", { value: initialKeyword }),
          onClear: () => {
            setSearchInput("");
            updateParams({ keyword: null });
          },
        }
      : null,
    selectedCategory
      ? {
          key: "category",
          label: t("chip.category", { value: selectedCategory.name }),
          onClear: () => updateParams({ category: null }),
        }
      : null,
    initialBudget !== "all"
      ? {
          key: "budget",
          label: t("chip.budget", {
            value: translateOption(BUDGET_KEYS, initialBudget),
          }),
          onClear: () => updateParams({ budget: null }),
        }
      : null,
    initialTime !== "all"
      ? {
          key: "time",
          label: t("chip.posted", {
            value: translateOption(TIME_KEYS, initialTime),
          }),
          onClear: () => updateParams({ time: null }),
        }
      : null,
    initialSort !== "newest"
      ? {
          key: "sort",
          label: t("chip.sort", {
            value: translateOption(SORT_KEYS, initialSort),
          }),
          onClear: () => updateParams({ sort: null }),
        }
      : null,
  ].filter(Boolean) as Array<{
    key: string;
    label: string;
    onClear: () => void;
  }>;

  const hasActiveFilters = activeChips.length > 0;
  const resultsLabel = initialKeyword
    ? t("resultsFor", { keyword: initialKeyword })
    : selectedCategory
      ? t("resultsInCategory", { category: selectedCategory.name })
      : t("openProjects", { count: pagination.total });

  const filterControls = (
    <>
      {/* Category Select (UC-46.07 A.2 — lọc job theo danh mục công việc) */}
      {initialCategories.length > 0 ? (
        <Select
          value={initialCategory}
          onValueChange={(value) => value && updateFilter("category", value)}
        >
          <SelectTrigger className="h-10 rounded-full bg-[#F3F3F7] dark:bg-zinc-800/90 border border-black/5 dark:border-white/10 px-4 py-2 text-xs sm:text-sm font-medium hover:bg-[#EAE9F0] dark:hover:bg-zinc-700 transition-colors cursor-pointer outline-none w-auto min-w-[150px]">
            <SelectValue placeholder={t("category.label")} />
          </SelectTrigger>
          <SelectContent className="rounded-[24px] border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 p-2 shadow-2xl font-sans">
            <SelectItem value="all" className="rounded-full cursor-pointer">
              {t("category.any")}
            </SelectItem>
            {initialCategories.map((jobCategory) => (
              <SelectItem
                key={jobCategory.id}
                value={jobCategory.slug}
                className="rounded-full cursor-pointer"
              >
                {jobCategory.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}

      {/* Budget Select */}
      <Select
        value={initialBudget}
        onValueChange={(value) => value && updateFilter("budget", value)}
      >
        <SelectTrigger className="h-10 rounded-full bg-[#F3F3F7] dark:bg-zinc-800/90 border border-black/5 dark:border-white/10 px-4 py-2 text-xs sm:text-sm font-medium hover:bg-[#EAE9F0] dark:hover:bg-zinc-700 transition-colors cursor-pointer outline-none w-auto min-w-[130px]">
          <SelectValue placeholder={t("budget.label")} />
        </SelectTrigger>
        <SelectContent className="rounded-[24px] border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 p-2 shadow-2xl font-sans">
          <SelectItem value="all" className="rounded-full cursor-pointer">
            {t("budget.any")}
          </SelectItem>
          {Object.entries(BUDGET_KEYS).map(([value, key]) => (
            <SelectItem
              key={value}
              value={value}
              className="rounded-full cursor-pointer"
            >
              {t(key)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Posted Time Select */}
      <Select
        value={initialTime}
        onValueChange={(value) => value && updateFilter("time", value)}
      >
        <SelectTrigger className="h-10 rounded-full bg-[#F3F3F7] dark:bg-zinc-800/90 border border-black/5 dark:border-white/10 px-4 py-2 text-xs sm:text-sm font-medium hover:bg-[#EAE9F0] dark:hover:bg-zinc-700 transition-colors cursor-pointer outline-none w-auto min-w-[130px]">
          <SelectValue placeholder={t("time.label")} />
        </SelectTrigger>
        <SelectContent className="rounded-[24px] border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 p-2 shadow-2xl font-sans">
          <SelectItem value="all" className="rounded-full cursor-pointer">
            {t("time.any")}
          </SelectItem>
          {Object.entries(TIME_KEYS).map(([value, key]) => (
            <SelectItem
              key={value}
              value={value}
              className="rounded-full cursor-pointer"
            >
              {t(key)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sort Select */}
      <Select
        value={initialSort}
        onValueChange={(value) => value && updateFilter("sort", value)}
      >
        <SelectTrigger className="h-10 rounded-full bg-[#F3F3F7] dark:bg-zinc-800/90 border border-black/5 dark:border-white/10 px-4 py-2 text-xs sm:text-sm font-medium hover:bg-[#EAE9F0] dark:hover:bg-zinc-700 transition-colors cursor-pointer outline-none w-auto min-w-[140px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-[24px] border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 p-2 shadow-2xl font-sans">
          {Object.entries(SORT_KEYS).map(([value, key]) => (
            <SelectItem
              key={value}
              value={value}
              className="rounded-full cursor-pointer"
            >
              {t(key)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );

  return (
    <div
      className={`flex flex-col bg-background font-sans ${
        embedded ? "min-h-0 flex-1" : "min-h-dvh"
      }`}
    >
      {!embedded && <Header role={role} />}

      {!embedded && (
        <BannerSlot
          position="GLOBAL_HEADER"
          className="border-b border-border/50 bg-background"
        />
      )}

      <main className="flex-1">
        {embedded ? (
          <section className="border-b border-border bg-background">
            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans sm:text-3xl">
                    {t("title")}
                  </h1>
                  <p className="mt-1 text-xs font-normal text-muted-foreground">
                    {t("subtitle")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#F1F0F5] dark:bg-zinc-800 px-3.5 py-1 text-xs font-medium text-muted-foreground">
                    {resultsLabel}
                  </span>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-white/10 dark:bg-[#1a1c1a]">
            <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
              <nav className="text-sm text-foreground/60">
                <Link
                  href="/"
                  className="transition-colors hover:text-[#4fae2e]"
                >
                  {tCommon("home")}
                </Link>
                <span className="text-muted-foreground/30">/</span>
                <span className="text-foreground font-medium">{t("title")}</span>
              </nav>

              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans sm:text-3xl">
                    {t("title")}
                  </h1>
                  <p className="mt-1 text-xs font-normal text-muted-foreground">
                    {t("subtitle")}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-[#F1F0F5] dark:bg-zinc-800 px-3.5 py-1 text-xs font-medium text-muted-foreground">
                    {resultsLabel}
                  </span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Filter & Search Bar */}
        <div
          className={`sticky ${
            embedded ? "top-0" : "top-16"
          } z-30 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 py-3.5`}
        >
          <div className="mx-auto max-w-7xl space-y-3 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* Keyword search bar */}
              <form
                onSubmit={handleSearchSubmit}
                className="relative flex-1 max-w-md"
              >
                <div className="relative flex items-center">
                  <Search className="pointer-events-none absolute left-3.5 size-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder={t("searchPlaceholder")}
                    className="h-10 w-full rounded-full bg-[#F3F3F7] dark:bg-zinc-800/90 pl-10 pr-9 text-xs sm:text-sm font-medium text-foreground placeholder:text-muted-foreground border border-black/5 dark:border-white/10 outline-none focus:ring-2 focus:ring-[#4fae2e]/30 transition-all"
                  />
                  {searchInput ? (
                    <button
                      type="button"
                      onClick={() => {
                        setSearchInput("");
                        updateParams({ keyword: null });
                      }}
                      className="absolute right-3 flex size-5 items-center justify-center rounded-full bg-muted text-muted-foreground hover:text-foreground cursor-pointer"
                      title={t("clearSearch")}
                    >
                      <X className="size-3" />
                    </button>
                  ) : null}
                </div>
              </form>

              {/* Desktop Filters */}
              <div className="hidden lg:flex items-center gap-2">
                {filterControls}
                {canBookmark ? (
                  <SaveSearchDialog
                    searchParams={currentSearchParams}
                    savedSearches={savedSearches}
                    onApply={applySavedSearch}
                    onChanged={() => router.refresh()}
                  />
                ) : null}
              </div>

              {/* Mobile Filter Sheet */}
              <div className="flex items-center justify-between gap-2 lg:hidden">
                <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-10 rounded-full gap-2 text-xs font-medium"
                    >
                      <SlidersHorizontal className="size-3.5" />
                      {t("filters")}
                      {hasActiveFilters ? (
                        <span className="rounded-full bg-[#4fae2e] px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {activeChips.length}
                        </span>
                      ) : null}
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="bottom"
                    closeLabel={tCommon("close")}
                    className="rounded-t-[28px] p-6 font-sans"
                  >
                    <SheetHeader>
                      <SheetTitle className="text-base font-bold text-foreground">
                        {t("filters")}
                      </SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 flex flex-col gap-3 pb-6">
                      {filterControls}
                    </div>
                    <Button
                      className="w-full rounded-full bg-[#4fae2e] text-white hover:bg-[#459928] text-xs font-semibold h-10"
                      onClick={() => setFiltersOpen(false)}
                    >
                      {t("showResults")}
                    </Button>
                  </SheetContent>
                </Sheet>

                {canBookmark ? (
                  <SaveSearchDialog
                    searchParams={currentSearchParams}
                    savedSearches={savedSearches}
                    onApply={applySavedSearch}
                    onChanged={() => router.refresh()}
                  />
                ) : null}
              </div>
            </div>

            {/* Active Filter Chips */}
            {hasActiveFilters ? (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {activeChips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={chip.onClear}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#F1F0F5] dark:bg-zinc-800 px-3 py-1 text-xs font-medium text-foreground hover:bg-[#EAE9F0] dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                  >
                    <span>{chip.label}</span>
                    <X className="size-3 text-muted-foreground hover:text-foreground" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-xs font-medium text-[#4fae2e] hover:underline ml-1 cursor-pointer"
                >
                  {t("clearAll")}
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <BannerSlot position="SEARCH_RESULTS" className="border-b border-border/50 bg-background" />

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {isPending ? (
            <JobListSkeleton />
          ) : jobs.length === 0 ? (
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
              <Button
                variant="outline"
                size="sm"
                className="mt-4 rounded-full text-xs cursor-pointer"
                onClick={clearAllFilters}
              >
                {t("clearAllFilters")}
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job, index) => (
                <JobCard
                  key={job.id}
                  job={job}
                  index={index}
                  jobBaseUrl={jobBaseUrl}
                  filterBasePath={effectiveBasePath}
                  canBookmark={canBookmark}
                  isBookmarked={bookmarkedSlugs.has(job.slug)}
                  isBookmarkPending={pendingBookmarkSlug === job.slug}
                  onToggleBookmark={toggleBookmark}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isPending && pagination.totalPages > 1 ? (
            <div className="mt-8 flex items-center justify-between border-t border-border pt-4 font-sans">
              <p className="font-sans text-xs text-muted-foreground">
                {t("pageOf", {
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
      </main>

      {!embedded && <Footer />}
    </div>
  );
}
