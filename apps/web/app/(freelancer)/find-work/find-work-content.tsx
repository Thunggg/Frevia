"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition, type MouseEvent } from "react";
import {
  ArrowRight,
  Bookmark,
  Clock,
  DollarSign,
  Loader2,
  SearchX,
  SlidersHorizontal,
  X,
} from "lucide-react";

import jobApiRequest from "@/apiRequests/job";
import { Footer } from "@/components/footer";
import { Header, type UserRole } from "@/components/header";
import { Badge } from "@repo/ui/components/shadcn/badge";
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

  return `$${job.budgetMin} - $${job.budgetMax}`;
}

function JobListSkeleton() {
  return (
    <ul className="divide-y divide-border" aria-hidden>
      {Array.from({ length: 5 }).map((_, index) => (
        <li key={index} className="space-y-3 py-6">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </li>
      ))}
    </ul>
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

  const updateFilter = (name: "budget" | "time" | "sort", value: string) => {
    updateParams({ [name]: value });
    setFiltersOpen(false);
  };

  const goToPage = (page: number) => {
    updateParams({ page: String(page) });
  };

  const clearAllFilters = () => {
    startTransition(() => {
      router.push("/find-work");
    });
  };

  const applySkillFilter = (skillName: string, event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
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
          onClear: () => updateParams({ keyword: null }),
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
      <Select
        value={initialBudget}
        onValueChange={(value) => value && updateFilter("budget", value)}
      >
        <SelectTrigger className="h-11 w-full bg-background">
          <SelectValue placeholder="Budget" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any budget</SelectItem>
          <SelectItem value="under-500">Under $500</SelectItem>
          <SelectItem value="500-1000">$500 - $1,000</SelectItem>
          <SelectItem value="1000-5000">$1,000 - $5,000</SelectItem>
          <SelectItem value="5000-plus">$5,000+</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={initialTime}
        onValueChange={(value) => value && updateFilter("time", value)}
      >
        <SelectTrigger className="h-11 w-full bg-background">
          <SelectValue placeholder="Posted" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Any time</SelectItem>
          <SelectItem value="today">Posted today</SelectItem>
          <SelectItem value="last-3-days">Last 3 days</SelectItem>
          <SelectItem value="last-7-days">Last 7 days</SelectItem>
          <SelectItem value="last-30-days">Last 30 days</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={initialSort}
        onValueChange={(value) => value && updateFilter("sort", value)}
      >
        <SelectTrigger className="h-11 w-full bg-background">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="newest">Newest</SelectItem>
          <SelectItem value="oldest">Oldest</SelectItem>
          <SelectItem value="title-asc">Title: A to Z</SelectItem>
          <SelectItem value="title-desc">Title: Z to A</SelectItem>
          <SelectItem value="budget-low">Budget: low to high</SelectItem>
          <SelectItem value="budget-high">Budget: high to low</SelectItem>
        </SelectContent>
      </Select>
    </>
  );

  return (
    <div className="flex min-h-dvh flex-col bg-background font-sans">
      <Header role={role} />

      <main className="flex-1">
        <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-white/10 dark:bg-[#1a1c1a]">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
            <nav className="text-sm text-foreground/60">
              <Link href="/" className="transition-colors hover:text-[#4fae2e]">
                Home
              </Link>
              <span className="mx-2 text-foreground/35">/</span>
              <span className="font-medium text-foreground">Find Work</span>
            </nav>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Find Work
            </h1>
            <p className="mt-2 max-w-[42ch] text-base text-foreground/70 dark:text-foreground/75">
              Browse open projects and apply to work that fits your skills.
            </p>
          </div>
        </section>

        <div className="sticky top-15 z-30 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
          <div className="mx-auto max-w-7xl space-y-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="hidden w-full max-w-6xl items-center gap-3 lg:flex">
                <div className="grid flex-1 grid-cols-4 gap-3">
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
              </div>

              <div className="flex items-center justify-between gap-3 lg:hidden">
                <p className="text-sm text-muted-foreground">{resultsLabel}</p>
                <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <SheetTrigger asChild>
                    <Button variant="outline" className="h-11 gap-2">
                      <SlidersHorizontal className="size-4" />
                      Filters
                      {hasActiveFilters ? (
                        <span className="rounded-full bg-[#4fae2e] px-1.5 text-xs text-white">
                          {activeChips.length}
                        </span>
                      ) : null}
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="bottom" className="rounded-t-2xl">
                    <SheetHeader>
                      <SheetTitle>Filters</SheetTitle>
                    </SheetHeader>
                    <div className="mt-4 grid gap-3 pb-6">{filterControls}</div>
                    <Button
                      className="w-full bg-[#4fae2e] text-white hover:bg-[#459928]"
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

              <p className="hidden text-sm text-muted-foreground lg:block">
                {resultsLabel}
              </p>
            </div>

            {hasActiveFilters ? (
              <div className="flex flex-wrap items-center gap-2">
                {activeChips.map((chip) => (
                  <button
                    key={chip.key}
                    type="button"
                    onClick={chip.onClear}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[#4fae2e]/30 bg-[#eaf8df] px-3 py-1.5 text-sm text-foreground transition-colors hover:bg-[#dff5cf] dark:border-[#4fae2e]/40 dark:bg-[#4fae2e]/10 dark:hover:bg-[#4fae2e]/15"
                  >
                    <span>{chip.label}</span>
                    <X className="size-3.5 text-[#4fae2e]" />
                  </button>
                ))}
                <button
                  type="button"
                  onClick={clearAllFilters}
                  className="text-sm font-medium text-[#4fae2e] transition-colors hover:text-[#3f9225]"
                >
                  Clear all
                </button>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {isPending ? (
            <JobListSkeleton />
          ) : jobs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border px-6 py-16 text-center">
              <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15">
                <SearchX className="size-7" />
              </div>
              <p className="text-lg font-medium text-foreground">
                No projects match these filters
              </p>
              <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
                Try a broader budget or time range, or clear your search.
              </p>
              <Button
                className="mt-6 bg-[#4fae2e] text-white hover:bg-[#459928]"
                onClick={clearAllFilters}
              >
                Clear filters
              </Button>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {jobs.map((job) => {
                const preview = job.description
                  ? stripHtml(job.description)
                  : "No description provided yet.";
                const skills = job.skills?.slice(0, 5) ?? [];
                const isBookmarked = bookmarkedSlugs.has(job.slug);
                const isBookmarkPending = pendingBookmarkSlug === job.slug;

                return (
                  <li key={job.id}>
                    <div
                      className={`px-4 py-6 transition-colors hover:bg-[#eaf8df]/35 sm:px-6 dark:hover:bg-white/4 ${
                        job.featured ? "border-l-2 border-l-[#4fae2e]" : ""
                      }`}
                    >
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            {job.featured ? (
                              <Badge className="bg-[#4fae2e] text-white hover:bg-[#4fae2e]">
                                Featured
                              </Badge>
                            ) : null}
                            <Link
                              href={`/job/${job.slug}`}
                              className="text-lg font-semibold tracking-tight text-foreground transition-colors hover:text-[#4fae2e]"
                            >
                              {job.title}
                            </Link>
                          </div>

                          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground">
                            <span className="inline-flex items-center gap-1.5">
                              <DollarSign className="size-3.5 text-[#4fae2e]" />
                              {getBudgetText(job)}
                              <span className="text-foreground/40">·</span>
                              {job.budgetType}
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                              <Clock className="size-3.5 text-[#4fae2e]" />
                              {formatPostedTime(job.createdAt)}
                            </span>
                          </div>

                          <p className="mt-3 max-w-3xl text-sm leading-relaxed text-muted-foreground line-clamp-2">
                            {preview}
                          </p>

                          {skills.length > 0 ? (
                            <div className="mt-4 flex flex-wrap gap-2">
                              {skills.map((skill) => (
                                <button
                                  key={`${job.id}-${skill.skillId}`}
                                  type="button"
                                  onClick={(event) =>
                                    applySkillFilter(skill.skill.name, event)
                                  }
                                  className="rounded-full border border-border bg-background px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:border-[#4fae2e]/50 hover:bg-[#eaf8df] hover:text-[#3f9225] dark:hover:bg-white/5"
                                >
                                  {skill.skill.name}
                                </button>
                              ))}
                              {(job.skills?.length ?? 0) > 5 ? (
                                <span className="self-center text-xs text-muted-foreground">
                                  +{(job.skills?.length ?? 0) - 5} more
                                </span>
                              ) : null}
                            </div>
                          ) : null}
                        </div>

                        <div className="flex shrink-0 items-center gap-2 sm:flex-col sm:items-end">
                          {canBookmark ? (
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="size-10"
                              disabled={isBookmarkPending}
                              aria-label={
                                isBookmarked ? "Remove bookmark" : "Save job"
                              }
                              onClick={(event) =>
                                toggleBookmark(job.slug, event)
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
                            </Button>
                          ) : null}
                          <Link
                            href={`/job/${job.slug}`}
                            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#4fae2e] transition-transform hover:translate-x-0.5"
                          >
                            View details
                            <ArrowRight className="size-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {!isPending && pagination.totalPages > 1 ? (
            <div className="mt-8 flex items-center justify-center gap-3 border-t border-border pt-8">
              <Button
                variant="outline"
                disabled={pagination.page <= 1}
                onClick={() => goToPage(pagination.page - 1)}
              >
                Previous
              </Button>
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => goToPage(pagination.page + 1)}
              >
                Next
              </Button>
            </div>
          ) : null}
        </div>
      </main>

      <Footer />
    </div>
  );
}
