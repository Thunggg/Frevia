"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useTransition,
  type FormEvent,
  type MouseEvent,
} from "react";
import { motion } from "motion/react";
import {
  Bookmark,
  Loader2,
  RefreshCw,
  Search,
  SearchX,
  Trash2,
} from "@/components/icons";

import jobApiRequest from "@/apiRequests/job";
import recommendationApiRequest from "@/apiRequests/recommendation";
import savedSearchApiRequest from "@/apiRequests/saved-search";
import { Footer } from "@/components/footer";
import { Header, type UserRole } from "@/components/header";
import { Button } from "@repo/ui/components/shadcn/button";
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
import { getBookmarkErrorMessage } from "@/lib/utils";
import { useActionPermission } from "@/hooks/use-action-permission";
import { JobCard } from "../../_components/job-card";
import { RecommendationExplanationDialog } from "../../_components/recommendation-explanation-dialog";
import { HomeProfileSidebar } from "../../_components/home-profile-sidebar";
import { ProjectHeroBanner } from "../../_components/project-hero-banner";
import { JobPagination } from "../../_components/job-pagination";
import { SavedSearchDetailDialog } from "../saved-searches/saved-search-detail-dialog";
import { ClientDirectory } from "./client-directory";

export type HomeTab =
  | "best-matches"
  | "most-recent"
  | "saved-searches"
  | "saved-jobs"
  | "find-clients";

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

// Stable fallbacks: synchronization effects must not receive a fresh array
// on every render when a tab does not load job-related data.
const EMPTY_SLUGS: string[] = [];
const EMPTY_JOBS: ViewJobDetailResType[] = [];
const EMPTY_SEARCHES: SavedSearchType[] = [];
const EMPTY_CATEGORIES: JobCategoryBrowseItemType[] = [];
const EMPTY_RECOMMENDATIONS: RecommendedJobType[] = [];

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

interface RecommendedJobFilterableExtra {
  category?: { slug?: string };
  hiringType?: string;
  proposalsCount?: number;
}

export function FindWorkContent({
  role,
  user = null,
  initialJobs,
  initialPagination,
  initialKeyword = "",
  initialBookmarkedSlugs = EMPTY_SLUGS,
  initialBookmarkedJobs = EMPTY_JOBS,
  initialSavedSearches = EMPTY_SEARCHES,
  initialCategories = EMPTY_CATEGORIES,
  initialRecommendedJobs = EMPTY_RECOMMENDATIONS,
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
  const tSaved = useTranslations("savedSearches");
  const [isPending, startTransition] = useTransition();

  const [searchInput, setSearchInput] = useState(initialKeyword);
  const [viewingSavedSearch, setViewingSavedSearch] =
    useState<SavedSearchType | null>(null);

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
  const [isLoadingSavedSearches, setIsLoadingSavedSearches] = useState(false);

  const { can } = useActionPermission();
  const canViewBookmarks = can("GET", "/api/manage-jobs/bookmarks");
  const canAddBookmark = can("POST", "/api/manage-jobs/jobs/:slug/bookmark");
  const canRemoveBookmark = can("DELETE", "/api/manage-jobs/bookmarks/:slug");
  const canViewSavedSearches = can("GET", "/api/saved-searches");
  const canViewSavedSearchDetail = can("GET", "/api/saved-searches/:id");
  const canDeleteSavedSearch = can("DELETE", "/api/saved-searches/:id");
  const canViewRecommendedJobs = can("GET", "/api/recommendations/jobs");
  const canViewRecommendationExplanation = can(
    "GET",
    "/api/recommendations/:id/explanation",
  );

  const canBookmark =
    role === "FREELANCER" && (canAddBookmark || canRemoveBookmark);

  // Tab State for Home View - Ưu tiên route path (e.g. /find-work/most-recent)
  const getTabFromContext = useCallback((): HomeTab => {
    const currentPath =
      pathname ||
      (typeof window !== "undefined" ? window.location.pathname : "");
    if (currentPath.includes("/most-recent")) return "most-recent";
    if (currentPath.includes("/saved-jobs")) return "saved-jobs";
    if (currentPath.includes("/saved-searches")) return "saved-searches";
    if (currentPath.includes("/find-clients")) return "find-clients";
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
        "find-clients",
      ].includes(requestedTab)
    ) {
      if (requestedTab === "best-matches" && !canViewRecommendedJobs) {
        return "most-recent";
      }
      return requestedTab;
    }
    return canViewRecommendedJobs ? "best-matches" : "most-recent";
  }, [pathname, searchParams, initialTab, canViewRecommendedJobs]);

  const [activeTab, setActiveTab] = useState<HomeTab>(getTabFromContext);

  useEffect(() => {
    if (activeTab === "best-matches" && !canViewRecommendedJobs) {
      setActiveTab("most-recent");
    }
  }, [activeTab, canViewRecommendedJobs]);

  useEffect(() => {
    setActiveTab(getTabFromContext());
  }, [getTabFromContext]);

  useEffect(() => {
    const handlePopState = () => {
      setActiveTab(getTabFromContext());
    };
    window.addEventListener("popstate", handlePopState);
    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, [getTabFromContext]);

  useEffect(() => {
    setSavedSearches(initialSavedSearches ?? []);
  }, [initialSavedSearches]);

  useEffect(() => {
    if (activeTab !== "saved-searches" || !canViewSavedSearches) return;

    let isCancelled = false;
    setIsLoadingSavedSearches(true);

    void savedSearchApiRequest
      .getSavedSearches()
      .then((res) => {
        if (!isCancelled && res.data) {
          setSavedSearches(res.data);
        }
      })
      .catch(() => {
        // Giữ dữ liệu hiện có nếu fetch lại thất bại
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingSavedSearches(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [activeTab, canViewSavedSearches]);

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

  const categoryFilter = searchParams.get("category");
  const budgetFilter = searchParams.get("budget");
  const hiringTypeFilter = searchParams.get("hiringType");
  const timeFilter = searchParams.get("time");
  const proposalsFilter = searchParams.get("proposals");

  const activeFiltersCount = [
    Boolean(categoryFilter),
    Boolean(budgetFilter),
    Boolean(proposalsFilter),
    Boolean(hiringTypeFilter),
    Boolean(timeFilter),
  ].filter(Boolean).length;

  const filteredRecommendedJobs = useMemo(() => {
    return recommendedJobs.filter((rec) => {
      const job = rec.job;
      if (!job) return false;
      const jobExtra = job as unknown as RecommendedJobFilterableExtra;

      // Category filter
      if (categoryFilter && categoryFilter !== "all") {
        const catSlugs = categoryFilter
          .split(",")
          .map((s) => s.trim().toLowerCase())
          .filter(Boolean);
        const jobCatSlug = jobExtra.category?.slug?.toLowerCase();
        if (!jobCatSlug || !catSlugs.includes(jobCatSlug)) {
          return false;
        }
      }

      // Budget filter
      if (budgetFilter && budgetFilter !== "all") {
        const min = job.budgetMin ?? 0;
        const max = job.budgetMax ?? job.budgetMin ?? 0;
        if (budgetFilter === "under-500" && max > 500) return false;
        if (budgetFilter === "500-1000" && (min > 1000 || max < 500)) return false;
        if (budgetFilter === "1000-5000" && (min > 5000 || max < 1000)) return false;
        if (budgetFilter === "5000-plus" && max < 5000) return false;
      }

      // Hiring type filter
      if (
        hiringTypeFilter &&
        (hiringTypeFilter === "SINGLE" || hiringTypeFilter === "MULTIPLE")
      ) {
        if (jobExtra.hiringType && jobExtra.hiringType !== hiringTypeFilter) {
          return false;
        }
      }

      // Time filter
      if (timeFilter && timeFilter !== "all") {
        const timeRanges: Record<string, number> = {
          today: 1,
          "last-3-days": 3,
          "last-7-days": 7,
          "last-30-days": 30,
        };
        const days = timeRanges[timeFilter];
        if (days && job.createdAt) {
          const jobDate = new Date(job.createdAt).getTime();
          const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
          if (jobDate < cutoff) return false;
        }
      }

      // Proposals filter
      if (proposalsFilter) {
        const pFilters = proposalsFilter.split(",");
        const count = jobExtra.proposalsCount ?? 0;
        const matchProp = pFilters.some((f) => {
          if (f === "fewer-than-5") return count < 5;
          if (f === "5-to-10") return count >= 5 && count <= 10;
          if (f === "10-to-15") return count >= 10 && count <= 15;
          if (f === "15-to-20") return count >= 15 && count <= 20;
          if (f === "20-to-50") return count >= 20 && count <= 50;
          return false;
        });
        if (!matchProp) return false;
      }

      return true;
    });
  }, [
    recommendedJobs,
    categoryFilter,
    budgetFilter,
    hiringTypeFilter,
    timeFilter,
    proposalsFilter,
  ]);

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
      canViewRecommendedJobs &&
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
  }, [activeTab, canViewRecommendedJobs, hasFetchedRecs, role]);

  const refreshRecommendations = async () => {
    setIsLoadingRecs(true);
    try {
      const res = await recommendationApiRequest.getRecommendedJobs(15);
      setRecommendedJobs(res.data.data ?? []);
      setHasFetchedRecs(true);
      toastSuccess({ message: tRec("refreshRecommendations") });
    } catch {
      toastError({ message: t("refreshRecommendationsFailed") });
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
    const targetBase = `/freelancer/find-work/${activeTab}`;
    startTransition(() => {
      router.push(query ? `${targetBase}?${query}` : targetBase, {
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

  const handleTabSelect = (tab: HomeTab) => {
    setActiveTab(tab);
    const isFilterTab = tab === "best-matches" || tab === "most-recent";
    const params = new URLSearchParams(searchParams.toString());
    params.delete("tab");
    params.delete("keyword");
    params.delete("page");
    if (!isFilterTab) {
      params.delete("category");
      params.delete("budget");
      params.delete("hiringType");
      params.delete("time");
      params.delete("proposals");
    }
    const query = params.toString();
    const targetUrl = `/freelancer/find-work/${tab}${query ? `?${query}` : ""}`;
    if (typeof window !== "undefined") {
      window.history.pushState(null, "", targetUrl);
    }
  };

  const applySavedSearch = (savedSearch: SavedSearchType) => {
    const nextParams = new URLSearchParams();
    const sp = (savedSearch.searchParams ?? {}) as Record<string, unknown>;

    for (const [key, value] of Object.entries(sp)) {
      if (
        typeof value === "string" ||
        typeof value === "number" ||
        typeof value === "boolean"
      ) {
        if (key === "keyword") {
          nextParams.set("q", String(value));
        } else {
          nextParams.set(key, String(value));
        }
      }
    }

    const queryText = sp.q || sp.keyword;
    if (queryText && !nextParams.has("q")) {
      nextParams.set("q", String(queryText));
    }

    const query = nextParams.toString();
    router.push(query ? `/freelancer/search/jobs?${query}` : "/freelancer/search/jobs");
  };

  const handleDeleteSavedSearch = async (id: number) => {
    try {
      await savedSearchApiRequest.delete(id);
      setSavedSearches((prev) => prev.filter((item) => item.id !== id));
      toastSuccess({ message: t("savedSearchDeleted") });
    } catch {
      toastError({ message: t("savedSearchDeleteFailed") });
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
    if (isBookmarked && !canRemoveBookmark) {
      toastError({ message: tBookmark("noPermission") });
      return;
    }
    if (!isBookmarked && !canAddBookmark) {
      toastError({ message: tBookmark("noPermission") });
      return;
    }

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
              {activeTab !== "find-clients" && <form onSubmit={handleSearchSubmit} className="relative pt-1">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="h-10 w-full rounded-xl border border-border bg-card pl-10 pr-24 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-foreground/40"
                />
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg bg-[#0069D3] hover:bg-[#005bb8] text-white px-4 py-1.5 text-xs font-medium cursor-pointer"
                >
                  {t("searchPage.search")}
                </button>
              </form>}

              {/* 4. Unified Tabs Row */}
              <div className="flex items-center justify-between border-b border-border pt-2 pb-px">
                <div className="flex items-center gap-6 overflow-x-auto no-scrollbar">
                  {/* Best matches */}
                  {canViewRecommendedJobs && (
                    <button
                      type="button"
                      onClick={() => handleTabSelect("best-matches")}
                      className={`pb-3 text-sm font-medium border-b-2 cursor-pointer whitespace-nowrap ${
                        activeTab === "best-matches"
                          ? "border-foreground text-foreground font-semibold"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>{t("bestMatches")}</span>
                      {filteredRecommendedJobs.length > 0 && (
                        <span className="ml-1.5 rounded-md bg-muted text-muted-foreground px-1.5 py-0.5 text-xs font-normal tabular-nums">
                          {filteredRecommendedJobs.length}
                        </span>
                      )}
                    </button>
                  )}

                  {/* Most recent */}
                  <button
                    type="button"
                    onClick={() => handleTabSelect("most-recent")}
                    className={`pb-3 text-sm font-medium border-b-2 cursor-pointer whitespace-nowrap ${
                      activeTab === "most-recent"
                        ? "border-foreground text-foreground font-semibold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{t("mostRecent")}</span>
                    <span className="ml-1.5 rounded-md bg-muted text-muted-foreground px-1.5 py-0.5 text-xs font-normal tabular-nums">
                      {pagination.total}
                    </span>
                  </button>

                  {/* Saved searches */}
                  {canViewSavedSearches && (
                    <button
                      type="button"
                      onClick={() => handleTabSelect("saved-searches")}
                      className={`pb-3 text-sm font-medium border-b-2 cursor-pointer whitespace-nowrap ${
                        activeTab === "saved-searches"
                          ? "border-foreground text-foreground font-semibold"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <span>{t("savedSearches")}</span>
                      {savedSearches.length > 0 && (
                        <span className="ml-1.5 rounded-md bg-muted text-muted-foreground px-1.5 py-0.5 text-xs font-normal tabular-nums">
                          {savedSearches.length}
                        </span>
                      )}
                    </button>
                  )}

                  {/* Saved jobs */}
                  <button
                    type="button"
                    onClick={() => handleTabSelect("saved-jobs")}
                    className={`pb-3 text-sm font-medium border-b-2 cursor-pointer whitespace-nowrap ${
                      activeTab === "saved-jobs"
                        ? "border-foreground text-foreground font-semibold"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <span>{t("savedJobs")}</span>
                    {bookmarkedSlugs.size > 0 && (
                      <span className="ml-1.5 rounded-md bg-muted text-muted-foreground px-1.5 py-0.5 text-xs font-normal tabular-nums">
                        {bookmarkedSlugs.size}
                      </span>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleTabSelect("find-clients")}
                    className={`pb-3 text-sm font-medium border-b-2 cursor-pointer whitespace-nowrap ${activeTab === "find-clients" ? "border-foreground text-foreground font-semibold" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                  >
                    {t("findClients")}
                  </button>
                </div>
              </div>

              {/* 5. Two-Column Home Content */}
              <div className="flex flex-col lg:flex-row gap-6 items-start pt-2">
                {/* Left / Main Column: Tab content */}
                <div className="flex-1 min-w-0 w-full space-y-3">
                  {/* TAB: FIND CLIENTS */}
                  {activeTab === "find-clients" && <ClientDirectory />}
                  {/* TAB 1: BEST MATCHES */}
                  {activeTab === "best-matches" && canViewRecommendedJobs && (
                    <div>
                      <div className="flex items-center justify-between pb-2">
                        <span className="text-xs text-muted-foreground">
                          {t("recsSubtitle")}
                        </span>
                        <button
                          type="button"
                          disabled={isLoadingRecs}
                          onClick={refreshRecommendations}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground hover:text-foreground cursor-pointer disabled:opacity-50"
                        >
                          <RefreshCw className="size-3" />
                          <span>{t("refresh")}</span>
                        </button>
                      </div>

                      {!hasFetchedRecs || isLoadingRecs ? (
                        <JobListSkeleton />
                      ) : filteredRecommendedJobs.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-14 text-center font-sans">
                          <p className="text-base font-semibold text-foreground">
                            {recommendedJobs.length === 0
                              ? tRec("emptyRecommendationsTitle")
                              : t("emptyTitle")}
                          </p>
                          <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground leading-relaxed">
                            {recommendedJobs.length === 0
                              ? tRec("emptyRecommendationsDesc")
                              : t("emptyDescription")}
                          </p>
                          <div className="mt-5 flex items-center gap-2.5">
                            {recommendedJobs.length === 0 ? (
                              <>
                                <Link
                                  href="/freelancer/profile"
                                  className="inline-flex items-center rounded-lg bg-[#0069D3] text-white hover:bg-[#005bb8] px-4 py-2 text-xs font-medium"
                                >
                                  Update profile
                                </Link>
                                <button
                                  type="button"
                                  onClick={() => handleTabSelect("most-recent")}
                                  className="inline-flex items-center rounded-lg border border-border bg-card hover:bg-muted/50 px-4 py-2 text-xs font-medium text-foreground cursor-pointer"
                                >
                                  Browse recent jobs
                                </button>
                              </>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                className="rounded-full text-xs font-semibold"
                                onClick={() => {
                                  updateParams({
                                    category: null,
                                    budget: null,
                                    proposals: null,
                                    hiringType: null,
                                    time: null,
                                    page: "1",
                                  });
                                }}
                              >
                                {t("clearFilters")}
                              </Button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {filteredRecommendedJobs.map((rec, index) => (
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
                              onViewExplanation={
                                canViewRecommendationExplanation
                                  ? (id, jobTitle) =>
                                      handleViewExplanation(
                                        id,
                                        jobTitle,
                                        rec.components,
                                        rec.score,
                                      )
                                  : undefined
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
                          {activeFiltersCount > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-4 rounded-full text-xs font-semibold"
                              onClick={() => {
                                updateParams({
                                  category: null,
                                  budget: null,
                                  proposals: null,
                                  hiringType: null,
                                  time: null,
                                  page: "1",
                                });
                              }}
                            >
                              {t("clearFilters")}
                            </Button>
                          )}
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
                      {pagination.totalPages > 1 && (
                        <JobPagination
                          currentPage={pagination.page}
                          totalPages={pagination.totalPages}
                          totalResults={pagination.total}
                          pageSize={pagination.limit}
                          onPageChange={goToPage}
                          onPageSizeChange={handlePageSizeChange}
                          isLoading={isPending}
                        />
                      )}
                    </div>
                  )}

                  {/* TAB 3: SAVED SEARCHES */}
                  {activeTab === "saved-searches" && canViewSavedSearches && (
                    <div className="space-y-3">
                      {isLoadingSavedSearches && savedSearches.length === 0 ? (
                        <div className="flex items-center justify-center rounded-2xl border border-border bg-card/40 py-14">
                          <Loader2 className="size-6 animate-spin text-muted-foreground" />
                        </div>
                      ) : savedSearches.length === 0 ? (
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
                                <h3
                                  onClick={() => applySavedSearch(item)}
                                  className="text-sm font-bold text-foreground truncate hover:text-[#0069D3] hover:underline cursor-pointer transition-colors"
                                >
                                  {item.name}
                                </h3>
                                <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                                  {Boolean(sp.q || sp.keyword) && (
                                    <span className="rounded-full bg-muted px-2.5 py-0.5">
                                      Keyword: {String(sp.q || sp.keyword)}
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
                                  {Boolean(sp.time) && (
                                    <span className="rounded-full bg-muted px-2.5 py-0.5">
                                      Time: {String(sp.time)}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {canViewSavedSearchDetail && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setViewingSavedSearch(item)}
                                    className="rounded-full text-xs font-semibold h-8 px-3.5 cursor-pointer"
                                  >
                                    {tSaved("viewDetails")}
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  onClick={() => applySavedSearch(item)}
                                  className="rounded-full bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-semibold h-8 px-4 cursor-pointer"
                                >
                                  {t("searchPage.search")}
                                </Button>
                                {canDeleteSavedSearch && (
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
                                )}
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
                      {!canViewBookmarks ? (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 px-6 py-14 text-center font-sans">
                          <Bookmark className="size-10 text-muted-foreground mb-3" />
                          <p className="text-base font-semibold text-foreground">
                            {tBookmark("viewListAccessDenied")}
                          </p>
                        </div>
                      ) : bookmarkedJobs.length === 0 ? (
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
                            canBookmark={canRemoveBookmark}
                            isBookmarked={true}
                            isBookmarkPending={pendingBookmarkSlug === job.slug}
                            onToggleBookmark={toggleBookmark}
                          />
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

      {/* Saved Search Detail Popup */}
      <SavedSearchDetailDialog
        savedSearch={viewingSavedSearch}
        open={Boolean(viewingSavedSearch)}
        onOpenChange={(nextOpen) => !nextOpen && setViewingSavedSearch(null)}
        categories={initialCategories}
        onApply={applySavedSearch}
      />
    </div>
  );
}
