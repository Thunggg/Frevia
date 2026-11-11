"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useEffect,
  useState,
  useTransition,
  type FormEvent,
  type MouseEvent,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Bookmark,
  ChevronLeft,
  ChevronRight,
  FolderOpen,
  InfoIcon,
  RefreshCw,
  Search,
  SearchX,
  SlidersHorizontal,
  Trash2,
  X,
} from "@/components/icons";

import jobApiRequest from "@/apiRequests/job";
import recommendationApiRequest from "@/apiRequests/recommendation";
import savedSearchApiRequest from "@/apiRequests/saved-search";
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
  GetMeResType,
  JobAlertType,
  JobCategoryBrowseItemType,
  RecommendationComponentsType,
  RecommendedJobType,
  SavedSearchType,
  ViewJobDetailResType,
  ViewListJobResponseType,
} from "@shared/types";
import { SaveSearchDialog } from "../saved-searches/save-search-dialog";
import { getBookmarkErrorMessage } from "@/lib/utils";
import { JobCard } from "../../_components/job-card";
import { RecommendationExplanationDialog } from "../../_components/recommendation-explanation-dialog";
import { HomeProfileSidebar } from "../../_components/home-profile-sidebar";
import { ProjectHeroBanner } from "../../_components/project-hero-banner";
import { JobPagination } from "../../_components/job-pagination";
import { HomeFiltersModal } from "../../_components/home-filters-modal";

export type HomeTab =
  | "best-matches"
  | "most-recent"
  | "saved-searches"
  | "saved-jobs"
  | "invites";

type FindWorkContentProps = {
  role: UserRole;
  user?: GetMeResType | null;
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
  initialBookmarkedJobs?: ViewJobDetailResType[];
  initialSavedSearches?: SavedSearchType[];
  initialJobAlerts?: JobAlertType[];
  initialCategories?: JobCategoryBrowseItemType[];
  initialRecommendedJobs?: RecommendedJobType[];
  embedded?: boolean;
  basePath?: string;
  initialTab?: HomeTab;
};

function JobListSkeleton() {
  return (
    <div className="space-y-4 font-sans" aria-hidden>
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-3.5"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-28 rounded-full" />
              <Skeleton className="h-4 w-20 rounded-full" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="size-8 rounded-full" />
              <Skeleton className="size-8 rounded-full" />
            </div>
          </div>
          <Skeleton className="h-6 w-3/4 rounded-md" />
          <Skeleton className="h-4 w-1/2 rounded-md" />
          <Skeleton className="h-4 w-full rounded-md" />
          <div className="flex items-center gap-2 pt-2">
            <Skeleton className="h-6 w-16 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-14 rounded-full" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function FindWorkContent({
  role,
  user = null,
  initialJobs,
  initialPagination,
  initialKeyword = "",
  initialCategory = "all",
  initialBudget = "all",
  initialTime = "all",
  initialSort = "newest",
  initialBookmarkedSlugs = [],
  initialBookmarkedJobs = [],
  initialSavedSearches = [],
  initialJobAlerts = [],
  initialCategories = [],
  initialRecommendedJobs = [],
  embedded = false,
  basePath,
  initialTab,
}: FindWorkContentProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations("findWork");
  const tRec = useTranslations("recommendation");
  const tBookmark = useTranslations("bookmark");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();

  const [searchInput, setSearchInput] = useState(initialKeyword);
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false);

  const [bookmarkedSlugs, setBookmarkedSlugs] = useState(
    () => new Set(initialBookmarkedSlugs),
  );
  const [bookmarkedJobs, setBookmarkedJobs] = useState<ViewJobDetailResType[]>(
    () => initialBookmarkedJobs ?? [],
  );
  const [pendingBookmarkSlug, setPendingBookmarkSlug] = useState<string | null>(
    null,
  );
  const [savedSearches, setSavedSearches] = useState<SavedSearchType[]>(
    () => initialSavedSearches ?? [],
  );
  const [jobAlerts, setJobAlerts] = useState<JobAlertType[]>(
    () => initialJobAlerts ?? [],
  );

  const canBookmark = role === "FREELANCER";

  // Tab State for Home View - Ưu tiên route path (e.g. /find-work/most-recent)
  const getTabFromContext = (): HomeTab => {
    const currentPath =
      typeof window !== "undefined" ? window.location.pathname : pathname;
    if (currentPath.includes("/most-recent")) return "most-recent";
    if (currentPath.includes("/saved-jobs")) return "saved-jobs";
    if (currentPath.includes("/saved-searches")) return "saved-searches";
    if (currentPath.includes("/invites")) return "invites";
    if (currentPath.includes("/best-matches")) return "best-matches";
    if (initialTab) return initialTab;
    const requestedTab = searchParams.get("tab") as HomeTab | null;
    if (
      requestedTab &&
      [
        "best-matches",
        "most-recent",
        "saved-searches",
        "saved-jobs",
        "invites",
      ].includes(requestedTab)
    ) {
      return requestedTab;
    }
    return "best-matches";
  };

  const [activeTab, setActiveTab] = useState<HomeTab>(getTabFromContext);

  useEffect(() => {
    setActiveTab(getTabFromContext());
  }, [pathname, searchParams, initialTab]);

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromContext());
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // State management for AI recommendations
  const [recommendedJobs, setRecommendedJobs] = useState<RecommendedJobType[]>(
    () => initialRecommendedJobs ?? [],
  );
  const [isLoadingRecs, setIsLoadingRecs] = useState(false);
  const [hasFetchedRecs, setHasFetchedRecs] = useState(
    () => (initialRecommendedJobs?.length ?? 0) > 0,
  );

  // Explanation Dialog State
  const [explanationModal, setExplanationModal] = useState<{
    open: boolean;
    recommendationId: number | null;
    jobTitle: string;
    components?: RecommendationComponentsType;
    matchScore?: number;
  }>({
    open: false,
    recommendationId: null,
    jobTitle: "",
  });

  const effectiveBasePath = basePath ?? "/freelancer/find-work/best-matches";
  const jobBaseUrl = "/freelancer/jobs";

  const activeFiltersCount = [
    Boolean(searchParams.get("category")),
    Boolean(searchParams.get("budget")),
    Boolean(searchParams.get("budgetType")),
    Boolean(searchParams.get("proposals")),
    Boolean(searchParams.get("verified")),
    Boolean(searchParams.get("hiringType")),
    Boolean(searchParams.get("time")),
  ].filter(Boolean).length;

  useEffect(() => {
    setBookmarkedSlugs(new Set(initialBookmarkedSlugs));
  }, [initialBookmarkedSlugs]);

  useEffect(() => {
    setBookmarkedJobs(initialBookmarkedJobs ?? []);
  }, [initialBookmarkedJobs]);

  useEffect(() => {
    setSavedSearches(initialSavedSearches ?? []);
  }, [initialSavedSearches]);

  useEffect(() => {
    setJobAlerts(initialJobAlerts ?? []);
  }, [initialJobAlerts]);

  useEffect(() => {
    setSearchInput(initialKeyword);
  }, [initialKeyword]);

  // Synchronize bookmarks across tabs
  useEffect(() => {
    const handleBookmarkUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{
        slug: string;
        isBookmarked: boolean;
      }>;
      if (!customEvent.detail) return;
      const { slug, isBookmarked } = customEvent.detail;
      setBookmarkedSlugs((current) => {
        const next = new Set(current);
        if (isBookmarked) {
          next.add(slug);
        } else {
          next.delete(slug);
        }
        return next;
      });
    };

    window.addEventListener("frevia:bookmark-updated", handleBookmarkUpdated);
    return () => {
      window.removeEventListener(
        "frevia:bookmark-updated",
        handleBookmarkUpdated,
      );
    };
  }, []);

  // Fetch recommendations when freelancer selects "best-matches" tab
  useEffect(() => {
    if (
      activeTab === "best-matches" &&
      !hasFetchedRecs &&
      role === "FREELANCER"
    ) {
      setIsLoadingRecs(true);
      recommendationApiRequest
        .getRecommendedJobs(15)
        .then((res) => {
          setRecommendedJobs(res.data.data ?? []);
          setHasFetchedRecs(true);
        })
        .catch(() => {
          setRecommendedJobs([]);
          setHasFetchedRecs(true);
        })
        .finally(() => {
          setIsLoadingRecs(false);
        });
    }
  }, [activeTab, hasFetchedRecs, role]);

  const refreshRecommendations = async () => {
    setIsLoadingRecs(true);
    try {
      const res = await recommendationApiRequest.getRecommendedJobs(15);
      setRecommendedJobs(res.data.data ?? []);
      setHasFetchedRecs(true);
      toastSuccess({ message: tRec("refreshRecommendations") });
    } catch {
      toastError({ message: "Không thể làm mới danh sách gợi ý" });
    } finally {
      setIsLoadingRecs(false);
    }
  };

  const handleViewExplanation = (
    recommendationId: number,
    jobTitle: string,
    components?: RecommendationComponentsType,
    matchScore?: number,
  ) => {
    setExplanationModal({
      open: true,
      recommendationId,
      jobTitle,
      components,
      matchScore,
    });
  };

  const jobs = initialJobs ?? [];
  const pagination = initialPagination ?? {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  };
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
    const currentPath =
      (typeof window !== "undefined" ? window.location.pathname : pathname) ||
      effectiveBasePath;
    startTransition(() => {
      router.push(query ? `${currentPath}?${query}` : currentPath, {
        scroll: false,
      });
    });
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    const query = searchInput.trim();
    if (query) {
      router.push(`/freelancer/search/jobs?q=${encodeURIComponent(query)}`);
    } else {
      router.push("/freelancer/search/jobs");
    }
  };

  const updateFilter = (
    name: "category" | "budget" | "time" | "sort",
    value: string,
  ) => {
    updateParams({ [name]: value, tab: null });
  };

  const clearAllFilters = () => {
    setSearchInput("");
    startTransition(() => {
      router.push(effectiveBasePath);
    });
  };

  const handleTabSelect = (tab: HomeTab) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tab");
    params.delete("keyword");
    const query = params.toString();
    const targetUrl = `/freelancer/find-work/${tab}${query ? `?${query}` : ""}`;
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", targetUrl);
    }
  };

  const applySavedSearch = (savedSearch: SavedSearchType) => {
    const nextParams = new URLSearchParams();
    const sp = (savedSearch.searchParams ?? {}) as Record<string, unknown>;

    if (sp.keyword) nextParams.set("keyword", String(sp.keyword));
    if (sp.category) nextParams.set("category", String(sp.category));
    if (sp.budget) nextParams.set("budget", String(sp.budget));
    if (sp.time) nextParams.set("time", String(sp.time));
    if (sp.sort) nextParams.set("sort", String(sp.sort));

    setSearchInput(sp.keyword ? String(sp.keyword) : "");

    const query = nextParams.toString();
    startTransition(() => {
      router.push(query ? `${effectiveBasePath}?${query}` : effectiveBasePath);
    });
  };

  const handleDeleteSavedSearch = async (id: number) => {
    try {
      await savedSearchApiRequest.delete(id);
      setSavedSearches((prev) => prev.filter((item) => item.id !== id));
      toastSuccess({ message: "Đã xóa tìm kiếm đã lưu" });
    } catch {
      toastError({ message: "Không thể xóa tìm kiếm" });
    }
  };

  const goToPage = (nextPage: number) => {
    updateParams({ page: String(nextPage) });
  };

  const handlePageSizeChange = (newSize: number) => {
    updateParams({ limit: String(newSize), page: "1" });
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
        const addedJob = jobs.find((j) => j.slug === slug);
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

  return (
    <div
      className={`flex flex-col bg-background font-sans ${
        embedded ? "min-h-0 flex-1" : "min-h-dvh"
      }`}
    >
      {!embedded && <Header role={role} />}

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 space-y-4">
          <div className="space-y-4">
            {/* 1. Project Hero Banner (from Schema / Project Assets) */}
            <ProjectHeroBanner />

              {/* 3. Search Bar Input */}
              <form onSubmit={handleSearchSubmit} className="relative pt-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="h-11 w-full rounded-full border border-border bg-card pl-11 pr-24 text-sm font-medium text-foreground placeholder:text-muted-foreground shadow-xs outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all"
                />
                <button
                  type="submit"
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                >
                  {t("searchPage.search")}
                </button>
              </form>

              {/* 4. Unified Tabs Row */}
              <div className="flex items-center justify-between border-b border-border pt-2 pb-px">
                <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
                  {/* Best matches */}
                  <button
                    type="button"
                    onClick={() => handleTabSelect("best-matches")}
                    className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === "best-matches"
                        ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{t("bestMatches")}</span>
                    {recommendedJobs.length > 0 && (
                      <span className="ml-1.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 text-xs font-semibold">
                        {recommendedJobs.length}
                      </span>
                    )}
                  </button>

                  {/* Most recent */}
                  <button
                    type="button"
                    onClick={() => handleTabSelect("most-recent")}
                    className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === "most-recent"
                        ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{t("mostRecent")}</span>
                    <span className="ml-1.5 rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-xs font-normal">
                      {pagination.total}
                    </span>
                  </button>

                  {/* Saved searches */}
                  <button
                    type="button"
                    onClick={() => handleTabSelect("saved-searches")}
                    className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === "saved-searches"
                        ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{t("savedSearches")}</span>
                    {savedSearches.length > 0 && (
                      <span className="ml-1.5 rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-xs font-normal">
                        {savedSearches.length}
                      </span>
                    )}
                  </button>

                  {/* Saved jobs */}
                  <button
                    type="button"
                    onClick={() => handleTabSelect("saved-jobs")}
                    className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === "saved-jobs"
                        ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{t("savedJobs")}</span>
                    {bookmarkedSlugs.size > 0 && (
                      <span className="ml-1.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 text-xs font-semibold">
                        {bookmarkedSlugs.size}
                      </span>
                    )}
                  </button>

                  {/* Invites */}
                  <button
                    type="button"
                    onClick={() => handleTabSelect("invites")}
                    className={`pb-3 text-sm font-semibold border-b-2 transition-all cursor-pointer whitespace-nowrap ${
                      activeTab === "invites"
                        ? "border-emerald-600 text-emerald-600 dark:text-emerald-400"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{t("invites")}</span>
                    {jobAlerts.length > 0 && (
                      <span className="ml-1.5 rounded-full bg-muted text-muted-foreground px-2 py-0.5 text-xs font-normal">
                        {jobAlerts.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Right Filter Icon Button: Mở Filters Modal áp dụng cho Best matches và Most recent */}
                <button
                  type="button"
                  onClick={() => setIsFiltersModalOpen(true)}
                  className={`flex size-9 shrink-0 items-center justify-center rounded-full border transition-all cursor-pointer ${
                    activeFiltersCount > 0
                      ? "border-emerald-600 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:border-emerald-500 dark:text-emerald-300 ring-2 ring-emerald-500/20"
                      : "border-border bg-card text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  title={t("modal.filterTooltip")}
                >
                  <SlidersHorizontal className="size-4" />
                </button>
              </div>

              {/* 5. Two-Column Home Content */}
              <div className="flex flex-col lg:flex-row gap-6 items-start pt-2">
                {/* Left / Main Column: Tab content */}
                <div className="flex-1 min-w-0 w-full space-y-3">
                  {/* TAB 1: BEST MATCHES */}
                  {activeTab === "best-matches" && (
                    <div>
                      <div className="flex items-center justify-between pb-2">
                        <span className="text-xs text-muted-foreground">
                          {t("recsSubtitle")}
                        </span>
                        <button
                          type="button"
                          disabled={isLoadingRecs}
                          onClick={refreshRecommendations}
                          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw
                            className={`size-3 ${
                              isLoadingRecs ? "animate-spin" : ""
                            }`}
                          />
                          <span>{t("refresh")}</span>
                        </button>
                      </div>

                      {!hasFetchedRecs || isLoadingRecs ? (
                        <JobListSkeleton />
                      ) : recommendedJobs.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-14 text-center font-sans"
                        >
                          <p className="text-base font-semibold text-foreground">
                            {tRec("emptyRecommendationsTitle")}
                          </p>
                          <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground leading-relaxed">
                            {tRec("emptyRecommendationsDesc")}
                          </p>
                          <div className="mt-5 flex items-center gap-2.5">
                            <Link
                              href="/freelancer/profile"
                              className="inline-flex items-center rounded-full bg-emerald-600 text-white hover:bg-emerald-700 px-4 py-2 text-xs font-semibold shadow-xs transition-colors"
                            >
                              Update profile
                            </Link>
                            <button
                              type="button"
                              onClick={() => handleTabSelect("most-recent")}
                              className="inline-flex items-center rounded-full border border-border bg-card hover:bg-accent/40 px-4 py-2 text-xs font-medium text-foreground transition-colors cursor-pointer"
                            >
                              Browse recent jobs
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        <div className="space-y-3">
                          {recommendedJobs.map((rec, index) => (
                            <JobCard
                              key={`rec-${rec.job.id}`}
                              job={rec.job}
                              index={index}
                              jobBaseUrl={jobBaseUrl}
                              filterBasePath={effectiveBasePath}
                              canBookmark={canBookmark}
                              isBookmarked={bookmarkedSlugs.has(rec.job.slug)}
                              isBookmarkPending={
                                pendingBookmarkSlug === rec.job.slug
                              }
                              onToggleBookmark={toggleBookmark}
                              matchScore={rec.score}
                              components={rec.components}
                              recommendationId={rec.recommendationId}
                              onViewExplanation={(id, jobTitle) =>
                                handleViewExplanation(
                                  id,
                                  jobTitle,
                                  rec.components,
                                  rec.score,
                                )
                              }
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 2: MOST RECENT */}
                  {activeTab === "most-recent" && (
                    <div>
                      {isPending ? (
                        <JobListSkeleton />
                      ) : jobs.length === 0 ? (
                        <motion.div
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-16 text-center font-sans"
                        >
                          <SearchX className="size-10 text-muted-foreground mb-3" />
                          <p className="text-base font-semibold text-foreground">
                            {t("emptyTitle")}
                          </p>
                          <p className="mt-1 text-xs text-muted-foreground">
                            {t("emptyDescription")}
                          </p>
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
                              isBookmarkPending={
                                pendingBookmarkSlug === job.slug
                              }
                              onToggleBookmark={toggleBookmark}
                            />
                          ))}
                        </div>
                      )}

                      {/* Pagination */}    
                      {!isPending && (
                        <JobPagination
                          currentPage={pagination.page}
                          totalPages={pagination.totalPages}
                          totalResults={pagination.total}
                          pageSize={pagination.limit}
                          onPageChange={goToPage}
                          onPageSizeChange={handlePageSizeChange}
                          isLoading={false}
                        />
                      )}
                    </div>
                  )}

                  {/* TAB 3: SAVED SEARCHES */}
                  {activeTab === "saved-searches" && (
                    <div className="space-y-3">
                      {savedSearches.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-14 text-center font-sans">
                          <Bookmark className="size-10 text-muted-foreground mb-3" />
                          <p className="text-base font-semibold text-foreground">
                            {t("noSavedSearches")}
                          </p>
                          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                            {t("noSavedSearchesDesc")}
                          </p>
                        </div>
                      ) : (
                        savedSearches.map((item) => {
                          const sp = (item.searchParams ?? {}) as Record<
                            string,
                            unknown
                          >;
                          return (
                            <div
                              key={item.id}
                              className="flex items-center justify-between rounded-2xl border border-border bg-card p-5 hover:border-black/20 dark:hover:border-white/20 transition-all font-sans"
                            >
                              <div className="space-y-1 min-w-0 flex-1 pr-4">
                                <h3 className="text-sm font-bold text-foreground truncate">
                                  {item.name}
                                </h3>
                                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                                  {Boolean(sp.keyword) && (
                                    <span className="rounded-full bg-muted px-2.5 py-0.5">
                                      Keyword: {String(sp.keyword)}
                                    </span>
                                  )}
                                  {Boolean(sp.category) && (
                                    <span className="rounded-full bg-muted px-2.5 py-0.5">
                                      Category: {String(sp.category)}
                                    </span>
                                  )}
                                  {Boolean(sp.budget) && (
                                    <span className="rounded-full bg-muted px-2.5 py-0.5">
                                      Budget: {String(sp.budget)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <Button
                                  size="sm"
                                  onClick={() => applySavedSearch(item)}
                                  className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-8 px-4"
                                >
                                  {t("searchPage.search")}
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    handleDeleteSavedSearch(item.id)
                                  }
                                  className="size-8 rounded-full text-muted-foreground hover:text-destructive cursor-pointer"
                                  title="Delete saved search"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )}

                  {/* TAB 4: SAVED JOBS */}
                  {activeTab === "saved-jobs" && (
                    <div className="space-y-3">
                      {bookmarkedJobs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-14 text-center font-sans">
                          <Bookmark className="size-10 text-muted-foreground mb-3" />
                          <p className="text-base font-semibold text-foreground">
                            {t("noSavedJobs")}
                          </p>
                          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                            {t("noSavedJobsDesc")}
                          </p>
                        </div>
                      ) : (
                        bookmarkedJobs.map((job, index) => (
                          <JobCard
                            key={`saved-${job.id}`}
                            job={job}
                            index={index}
                            jobBaseUrl={jobBaseUrl}
                            filterBasePath={effectiveBasePath}
                            canBookmark={true}
                            isBookmarked={true}
                            isBookmarkPending={pendingBookmarkSlug === job.slug}
                            onToggleBookmark={toggleBookmark}
                          />
                        ))
                      )}
                    </div>
                  )}

                  {/* TAB 5: INVITES & JOB ALERTS */}
                  {activeTab === "invites" && (
                    <div className="space-y-3">
                      {jobAlerts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-14 text-center font-sans">
                          <InfoIcon className="size-10 text-muted-foreground mb-3" />
                          <p className="text-base font-semibold text-foreground">
                            {t("noInvites")}
                          </p>
                          <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                            {t("noInvitesDesc")}
                          </p>
                        </div>
                      ) : (
                        jobAlerts.map((alert) => (
                          <div
                            key={alert.id}
                            className="flex items-center justify-between rounded-2xl border border-border bg-card p-5 hover:border-black/20 dark:hover:border-white/20 transition-all font-sans"
                          >
                            <div className="space-y-1 min-w-0 flex-1 pr-4">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-foreground truncate">
                                  {alert.name}
                                </h3>
                                <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold px-2 py-0.5">
                                  {alert.frequency}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground truncate">
                                Keywords: {alert.keywords || "Any"}
                              </p>
                            </div>
                            <Link
                              href="/freelancer/proposals"
                              className="rounded-full border border-border hover:bg-muted px-4 py-1.5 text-xs font-semibold text-foreground transition-colors shrink-0"
                            >
                              View details
                            </Link>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

                {/* Right Column: Profile & KYC Sidebar */}
                <HomeProfileSidebar user={user ?? null} />
              </div>
            </div>
        </div>
      </main>

      {!embedded && <Footer />}

      {/* Recommendation Explanation Modal */}
      <RecommendationExplanationDialog
        open={explanationModal.open}
        onOpenChange={(open) =>
          setExplanationModal((prev) => ({ ...prev, open }))
        }
        recommendationId={explanationModal.recommendationId}
        jobTitle={explanationModal.jobTitle}
        components={explanationModal.components}
        matchScore={explanationModal.matchScore}
      />

      {/* Home Quick Filters Modal (Best matches & Most recent) */}
      <HomeFiltersModal
        open={isFiltersModalOpen}
        onOpenChange={setIsFiltersModalOpen}
        categories={initialCategories}
        currentFilters={{
          category: searchParams.get("category"),
          budget: searchParams.get("budget"),
          budgetType:
            searchParams.get("budgetType") === "FIXED_PRICE"
              ? "FIXED_PRICE"
              : null,
          proposals: searchParams.get("proposals")
            ? searchParams.get("proposals")!.split(",")
            : null,
          verified: searchParams.get("verified") === "true",
          hiringType:
            searchParams.get("hiringType") === "SINGLE" ||
            searchParams.get("hiringType") === "MULTIPLE"
              ? (searchParams.get("hiringType") as "SINGLE" | "MULTIPLE")
              : null,
          time: searchParams.get("time"),
        }}
        onApply={(newFilters) => {
          updateParams({
            category: newFilters.category ?? null,
            budget: newFilters.budget ?? null,
            budgetType: newFilters.budgetType ?? null,
            proposals: newFilters.proposals?.join(",") ?? null,
            verified: newFilters.verified ? "true" : null,
            hiringType: newFilters.hiringType ?? null,
            time: newFilters.time ?? null,
            page: "1",
          });
        }}
      />
    </div>
  );
}
