"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition, type FormEvent, type MouseEvent } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  Bookmark,
  Clock,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Search,
  SearchX,
  SlidersHorizontal,
  X,
} from "@/components/icons";

import jobApiRequest from "@/apiRequests/job";
import { Footer } from "@/components/footer";
import { Header, type UserRole } from "@/components/header";
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
import type { SavedSearchType, ViewListJobResponseType } from "@shared/types";
import { SaveSearchDialog } from "../saved-searches/save-search-dialog";

type JobItem = ViewListJobResponseType["data"][number];

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
  initialBudget?: string;
  initialTime?: string;
  initialSort?: string;
  initialBookmarkedSlugs?: string[];
  initialSavedSearches?: SavedSearchType[];
};

const BUDGET_LABELS: Record<string, string> = {
  "under-500": "Under $500",
  "500-1000": "$500 - $1,000",
  "1000-5000": "$1,000 - $5,000",
  "5000-plus": "$5,000+",
};

const TIME_LABELS: Record<string, string> = {
  today: "Posted today",
  "last-3-days": "Last 3 days",
  "last-7-days": "Last 7 days",
  "last-30-days": "Last 30 days",
};

const SORT_LABELS: Record<string, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  "title-asc": "Title (A-Z)",
  "title-desc": "Title (Z-A)",
  "budget-low": "Budget: Low to High",
  "budget-high": "Budget: High to Low",
};

function stripHtml(value: string) {
  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function formatPostedTime(value: string | Date) {
  const diffMs = Date.now() - new Date(value).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;

  return `${Math.floor(diffHours / 24)}d ago`;
}

function getBudgetText(job: JobItem) {
  if (job.budgetMin === null || job.budgetMax === null) {
    return "Negotiable";
  }

  return `$${job.budgetMin.toLocaleString()} – $${job.budgetMax.toLocaleString()}`;
}

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
  initialBudget = "all",
  initialTime = "all",
  initialSort = "newest",
  initialBookmarkedSlugs = [],
  initialSavedSearches = [],
}: FindWorkContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
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
      router.push(query ? `/find-work?${query}` : "/find-work");
    });
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    updateParams({ keyword: searchInput.trim() || null });
  };

  const updateFilter = (name: "budget" | "time" | "sort", value: string) => {
    updateParams({ [name]: value });
    setFiltersOpen(false);
  };

  const goToPage = (page: number) => {
    updateParams({ page: String(page) });
  };

  const clearAllFilters = () => {
    setSearchInput("");
    startTransition(() => {
      router.push("/find-work");
    });
  };

  const applySkillFilter = (skillName: string, event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setSearchInput(skillName);
    updateParams({ keyword: skillName });
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
      router.push(query ? `/find-work?${query}` : "/find-work");
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
        toastSuccess({ message: "Bookmark removed" });
      } else {
        await jobApiRequest.bookmarkJob(slug);
        setBookmarkedSlugs((current) => new Set(current).add(slug));
        toastSuccess({ message: "Job saved to bookmarks" });
      }
    } catch {
      toastError({
        message: isBookmarked
          ? "Couldn't remove bookmark. Try again."
          : "Couldn't update bookmark. Try again.",
      });
    } finally {
      setPendingBookmarkSlug(null);
    }
  };

  const activeChips = [
    initialKeyword
      ? {
          key: "keyword",
          label: `Search: ${initialKeyword}`,
          onClear: () => {
            setSearchInput("");
            updateParams({ keyword: null });
          },
        }
      : null,
    initialBudget !== "all"
      ? {
          key: "budget",
          label: `Budget: ${BUDGET_LABELS[initialBudget] ?? initialBudget}`,
          onClear: () => updateParams({ budget: null }),
        }
      : null,
    initialTime !== "all"
      ? {
          key: "time",
          label: `Posted: ${TIME_LABELS[initialTime] ?? initialTime}`,
          onClear: () => updateParams({ time: null }),
        }
      : null,
    initialSort !== "newest"
      ? {
          key: "sort",
          label: `Sort: ${SORT_LABELS[initialSort] ?? initialSort}`,
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
    ? `Results for "${initialKeyword}"`
    : pagination.total > 0
      ? `${pagination.total} open project${pagination.total === 1 ? "" : "s"}`
      : "No open projects";

  const filterControls = (
    <>
      {/* Budget Select */}
      <Select
        value={initialBudget}
        onValueChange={(value) => value && updateFilter("budget", value)}
      >
        <SelectTrigger className="h-10 rounded-full bg-[#F3F3F7] dark:bg-zinc-800/90 border border-black/5 dark:border-white/10 px-4 py-2 text-xs sm:text-sm font-medium hover:bg-[#EAE9F0] dark:hover:bg-zinc-700 transition-colors cursor-pointer outline-none w-auto min-w-[130px]">
          <SelectValue placeholder="Budget" />
        </SelectTrigger>
        <SelectContent className="rounded-[24px] border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 p-2 shadow-2xl font-sans">
          <SelectItem value="all" className="rounded-full cursor-pointer">Any budget</SelectItem>
          <SelectItem value="under-500" className="rounded-full cursor-pointer">Under $500</SelectItem>
          <SelectItem value="500-1000" className="rounded-full cursor-pointer">$500 - $1,000</SelectItem>
          <SelectItem value="1000-5000" className="rounded-full cursor-pointer">$1,000 - $5,000</SelectItem>
          <SelectItem value="5000-plus" className="rounded-full cursor-pointer">$5,000+</SelectItem>
        </SelectContent>
      </Select>

      {/* Posted Time Select */}
      <Select
        value={initialTime}
        onValueChange={(value) => value && updateFilter("time", value)}
      >
        <SelectTrigger className="h-10 rounded-full bg-[#F3F3F7] dark:bg-zinc-800/90 border border-black/5 dark:border-white/10 px-4 py-2 text-xs sm:text-sm font-medium hover:bg-[#EAE9F0] dark:hover:bg-zinc-700 transition-colors cursor-pointer outline-none w-auto min-w-[130px]">
          <SelectValue placeholder="Posted" />
        </SelectTrigger>
        <SelectContent className="rounded-[24px] border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 p-2 shadow-2xl font-sans">
          <SelectItem value="all" className="rounded-full cursor-pointer">Any time</SelectItem>
          <SelectItem value="today" className="rounded-full cursor-pointer">Posted today</SelectItem>
          <SelectItem value="last-3-days" className="rounded-full cursor-pointer">Last 3 days</SelectItem>
          <SelectItem value="last-7-days" className="rounded-full cursor-pointer">Last 7 days</SelectItem>
          <SelectItem value="last-30-days" className="rounded-full cursor-pointer">Last 30 days</SelectItem>
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
          <SelectItem value="newest" className="rounded-full cursor-pointer">Newest first</SelectItem>
          <SelectItem value="oldest" className="rounded-full cursor-pointer">Oldest first</SelectItem>
          <SelectItem value="title-asc" className="rounded-full cursor-pointer">Title: A to Z</SelectItem>
          <SelectItem value="title-desc" className="rounded-full cursor-pointer">Title: Z to A</SelectItem>
          <SelectItem value="budget-low" className="rounded-full cursor-pointer">Budget: low to high</SelectItem>
          <SelectItem value="budget-high" className="rounded-full cursor-pointer">Budget: high to low</SelectItem>
        </SelectContent>
      </Select>
    </>
  );

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role={role} />

      <main className="flex-1 font-sans">
        {/* Page Header */}
        <section className="border-b border-border bg-background">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-2 font-sans text-xs text-muted-foreground">
              <Link
                href="/"
                className="transition-colors hover:text-foreground font-medium"
              >
                Home
              </Link>
              <span className="text-muted-foreground/30">/</span>
              <span className="text-foreground font-medium">Find Work</span>
            </nav>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground font-sans sm:text-3xl">
                  Find Work
                </h1>
                <p className="mt-1 text-xs font-normal text-muted-foreground">
                  Browse open projects and apply to work that fits your skills.
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

        {/* Filter & Search Bar */}
        <div className="sticky top-16 z-30 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80 py-3.5">
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
                    placeholder="Search jobs by title or skill..."
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
                      title="Clear search"
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
                      Filters
                      {hasActiveFilters ? (
                        <span className="rounded-full bg-[#4fae2e] px-1.5 py-0.5 text-[10px] font-bold text-white">
                          {activeChips.length}
                        </span>
                      ) : null}
                    </Button>
                  </SheetTrigger>
                  <SheetContent
                    side="bottom"
                    className="rounded-t-[28px] p-6 font-sans"
                  >
                    <SheetHeader>
                      <SheetTitle className="text-base font-bold text-foreground">
                        Filters
                      </SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 flex flex-col gap-3 pb-6">
                      {filterControls}
                    </div>
                    <Button
                      className="w-full rounded-full bg-[#4fae2e] text-white hover:bg-[#459928] text-xs font-semibold h-10"
                      onClick={() => setFiltersOpen(false)}
                    >
                      Show results
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
                  Clear all
                </button>
              </div>
            ) : null}
          </div>
        </div>

        {/* Job Listings Area */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
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
                No projects match these filters
              </p>
              <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                Try a broader budget or time range, or clear your search keyword.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="mt-4 rounded-full text-xs cursor-pointer"
                onClick={clearAllFilters}
              >
                Clear all filters
              </Button>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job, index) => {
                const preview = job.description
                  ? stripHtml(job.description)
                  : "No description provided yet.";
                const skills = job.skills?.slice(0, 5) ?? [];
                const isBookmarked = bookmarkedSlugs.has(job.slug);
                const isBookmarkPending = pendingBookmarkSlug === job.slug;

                return (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.35,
                      delay: index * 0.03,
                    }}
                    className="group relative flex flex-col justify-between rounded-[28px] border border-border bg-card p-5 sm:p-6 transition-all hover:bg-accent/10 shadow-xs font-sans"
                  >
                    <div>
                      {/* Top Header Row: Status, Badges & Bookmark Button */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          {job.featured ? (
                            <span className="inline-flex items-center rounded-full bg-[#4fae2e] text-white px-3 py-0.5 text-xs font-semibold">
                              Featured
                            </span>
                          ) : null}
                          <span className="inline-flex items-center rounded-full bg-[#D0E1F8] text-[#0069D3] dark:bg-blue-950/60 dark:text-blue-300 px-3 py-0.5 text-xs font-semibold">
                            {job.status.replaceAll("_", " ")}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-normal">
                            <Clock className="size-3.5" />
                            {formatPostedTime(job.createdAt)}
                          </span>
                        </div>

                        {canBookmark ? (
                          <button
                            type="button"
                            disabled={isBookmarkPending}
                            aria-label={
                              isBookmarked ? "Remove bookmark" : "Save job"
                            }
                            onClick={(event) =>
                              toggleBookmark(job.slug, event)
                            }
                            className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-all cursor-pointer outline-none ${
                              isBookmarked
                                ? "bg-[#4fae2e]/10 text-[#4fae2e] hover:bg-[#4fae2e]/20"
                                : "bg-[#F3F3F7] dark:bg-zinc-800 text-muted-foreground hover:text-foreground hover:bg-[#EAE9F0] dark:hover:bg-zinc-700"
                            }`}
                            title={
                              isBookmarked
                                ? "Remove from bookmarks"
                                : "Save to bookmarks"
                            }
                          >
                            {isBookmarkPending ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Bookmark
                                className={`size-4 ${
                                  isBookmarked
                                    ? "fill-[#4fae2e] text-[#4fae2e]"
                                    : ""
                                }`}
                              />
                            )}
                          </button>
                        ) : null}
                      </div>

                      {/* Job Title & Budget */}
                      <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                        <Link
                          href={`/job/${job.slug}`}
                          className="text-base sm:text-lg font-bold text-foreground hover:text-[#4fae2e] transition-colors line-clamp-1"
                        >
                          {job.title}
                        </Link>
                        <div className="shrink-0 text-xs sm:text-sm font-semibold text-foreground">
                          {getBudgetText(job)}{" "}
                          <span className="font-normal text-muted-foreground capitalize">
                            ({job.budgetType.toLowerCase().replace("_", " ")})
                          </span>
                        </div>
                      </div>

                      {/* Description Preview */}
                      <p className="mt-2 text-xs sm:text-sm font-normal text-muted-foreground leading-relaxed line-clamp-2">
                        {preview}
                      </p>
                    </div>

                    {/* Bottom Row: Skills & View Action */}
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {skills.map((skill) => (
                          <button
                            key={`${job.id}-${skill.skillId}`}
                            type="button"
                            onClick={(event) =>
                              applySkillFilter(skill.skill.name, event)
                            }
                            className="rounded-full bg-[#F1F0F5] dark:bg-zinc-800/80 hover:bg-[#EAE9F0] dark:hover:bg-zinc-700 px-3 py-1 text-xs font-medium text-foreground transition-colors cursor-pointer"
                          >
                            {skill.skill.name}
                          </button>
                        ))}
                        {(job.skills?.length ?? 0) > 5 ? (
                          <span className="text-xs text-muted-foreground self-center ml-1">
                            +{(job.skills?.length ?? 0) - 5} more
                          </span>
                        ) : null}
                      </div>

                      <Link
                        href={`/job/${job.slug}`}
                        className="inline-flex items-center gap-1.5 self-start sm:self-auto rounded-full bg-[#4fae2e] text-white hover:bg-[#459928] px-4 py-2 text-xs font-semibold shadow-xs transition-all hover:translate-x-0.5"
                      >
                        <span>View details</span>
                        <ArrowRight className="size-3.5" />
                      </Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!isPending && pagination.totalPages > 1 ? (
            <div className="mt-8 flex items-center justify-between border-t border-border pt-4 font-sans">
              <p className="font-sans text-xs text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
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

      <Footer />
    </div>
  );
}
