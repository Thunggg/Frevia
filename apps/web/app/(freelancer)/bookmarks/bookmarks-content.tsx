"use client";

import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { motion } from "motion/react";
import {
  ArrowRight,
  ArrowUpDown,
  Bookmark,
  BriefcaseBusiness,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Loader2,
  MapPin,
  Search,
  Trash2,
  X,
} from "@/components/icons";

import jobApiRequest from "@/apiRequests/job";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@repo/ui/components/shadcn/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { Button } from "@repo/ui/components/shadcn/button";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type { ViewBookmarkedJobResponseType } from "@shared/types";

type BookmarksContentProps = {
  initialJobs: ViewBookmarkedJobResponseType["data"];
  pagination: ViewBookmarkedJobResponseType["pagination"];
  embedded?: boolean;
  basePath?: string;
  initialSearch?: string;
  initialStatus?: string;
  initialOrder?: "asc" | "desc";
  initialLimit?: number;
};

const JOB_STATUS_KEYS = [
  "DRAFT",
  "OPEN",
  "IN_PROGRESS",
  "COMPLETED",
  "CLOSED",
  "CANCELLED",
] as const;

const JOB_BUDGET_TYPE_KEYS = ["FIXED_PRICE"] as const;

const STATUS_FILTERS = [
  { key: "all", value: "all" },
  { key: "OPEN", value: "OPEN" },
  { key: "CLOSED", value: "CLOSED" },
  { key: "IN_PROGRESS", value: "IN_PROGRESS" },
  { key: "COMPLETED", value: "COMPLETED" },
] as const;

const PAGE_SIZE_OPTIONS = [5, 10, 20] as const;

function getAvailability(job: ViewBookmarkedJobResponseType["data"][number]) {
  if (job.status !== "OPEN") {
    return { key: "closed", isExpiring: false, isClosed: true };
  }
  if (!job.expiryDate) return { key: "available", isExpiring: false, isClosed: false };
  const hoursUntilExpiry =
    (new Date(job.expiryDate).getTime() - Date.now()) / 3_600_000;
  if (hoursUntilExpiry <= 0) {
    return { key: "expired", isExpiring: false, isClosed: true };
  }
  return hoursUntilExpiry <= 24
    ? { key: "expiringSoon", isExpiring: true, isClosed: false }
    : { key: "available", isExpiring: false, isClosed: false };
}

export function BookmarksContent({
  initialJobs,
  pagination,
  embedded = false,
  basePath,
  initialSearch = "",
  initialStatus = "all",
  initialOrder = "desc",
  initialLimit = 10,
}: BookmarksContentProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("bookmarks");
  const tStatus = useTranslations("jobStatus");
  const tBudgetType = useTranslations("jobBudgetType");
  const tCommon = useTranslations("common");
  const format = useFormatter();

  const [jobs, setJobs] = useState(initialJobs);
  const [totalCount, setTotalCount] = useState(pagination.total);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">(initialOrder);
  const [pageSize, setPageSize] = useState(initialLimit);

  // Quick View Modal
  const [quickViewJob, setQuickViewJob] = useState<
    ViewBookmarkedJobResponseType["data"][number] | null
  >(null);

  // Remove confirmation modal
  const [pendingRemoveJobSlug, setPendingRemoveJobSlug] = useState<
    string | null
  >(null);
  const [isRemoving, setIsRemoving] = useState(false);

  useEffect(() => {
    setJobs(initialJobs);
    setTotalCount(pagination.total);
  }, [initialJobs, pagination.total]);

  useEffect(() => {
    setSearchQuery(initialSearch);
  }, [initialSearch]);

  useEffect(() => {
    setStatusFilter(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    setSortOrder(initialOrder);
  }, [initialOrder]);

  useEffect(() => {
    setPageSize(initialLimit);
  }, [initialLimit]);

  // Đồng bộ trạng thái bookmark đa màn hình (UC-12.03)
  useEffect(() => {
    const handleBookmarkUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{
        slug: string;
        isBookmarked: boolean;
      }>;
      if (!customEvent.detail) return;
      const { slug, isBookmarked } = customEvent.detail;
      if (!isBookmarked) {
        setJobs((current) => current.filter((j) => j.slug !== slug));
        setTotalCount((current) => Math.max(0, current - 1));
      }
    };

    window.addEventListener("frevia:bookmark-updated", handleBookmarkUpdated);
    return () => {
      window.removeEventListener(
        "frevia:bookmark-updated",
        handleBookmarkUpdated,
      );
    };
  }, []);

  const formatBudget = (job: ViewBookmarkedJobResponseType["data"][number]) => {
    if (job.budgetMin === null || job.budgetMax === null) return t("negotiable");

    const currency = {
      style: "currency" as const,
      currency: "USD",
      maximumFractionDigits: 0,
    };
    return t("budgetRange", {
      min: format.number(job.budgetMin, currency),
      max: format.number(job.budgetMax, currency),
    });
  };

  const formatPostedTime = (value: string | Date) => {
    const hours = Math.max(
      0,
      Math.floor((Date.now() - new Date(value).getTime()) / 3_600_000),
    );
    if (hours < 1) return tCommon("justNow");
    if (hours < 24) return tCommon("hoursAgo", { hours });

    return tCommon("daysAgo", { days: Math.floor(hours / 24) });
  };

  const formatDate = (value: string | Date | null) => {
    if (!value) return "N/A";
    return format.dateTime(new Date(value), {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const effectiveBasePath =
    basePath ?? (embedded ? "/freelancer/bookmarks" : "/bookmarks");
  const jobBaseUrl = embedded ? "/freelancer/jobs" : "/job";

  // Cập nhật URL và tải lại dữ liệu khi filter thay đổi
  const navigateWithFilters = (updates: {
    page?: number;
    search?: string;
    status?: string;
    order?: "asc" | "desc";
    limit?: number;
  }) => {
    const targetPage = updates.page ?? 1;
    const targetSearch = updates.search !== undefined ? updates.search : searchQuery;
    const targetStatus = updates.status !== undefined ? updates.status : statusFilter;
    const targetOrder = updates.order !== undefined ? updates.order : sortOrder;
    const targetLimit = updates.limit !== undefined ? updates.limit : pageSize;

    const params = new URLSearchParams();
    if (targetPage > 1) params.set("page", String(targetPage));
    if (targetLimit !== 10) params.set("limit", String(targetLimit));
    if (targetSearch.trim()) params.set("search", targetSearch.trim());
    if (targetStatus && targetStatus !== "all") params.set("status", targetStatus);
    if (targetOrder !== "desc") params.set("order", targetOrder);

    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `${effectiveBasePath}?${qs}` : effectiveBasePath);
    });
  };

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    navigateWithFilters({ page: 1, search: searchQuery });
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    navigateWithFilters({ page: 1, search: "" });
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    navigateWithFilters({ page: 1, status });
  };

  const handleSortOrderToggle = () => {
    const nextOrder = sortOrder === "desc" ? "asc" : "desc";
    setSortOrder(nextOrder);
    navigateWithFilters({ page: 1, order: nextOrder });
  };

  const handlePageSizeChange = (limit: number) => {
    setPageSize(limit);
    navigateWithFilters({ page: 1, limit });
  };

  const handleResetAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setSortOrder("desc");
    setPageSize(10);
    navigateWithFilters({
      page: 1,
      search: "",
      status: "all",
      order: "desc",
      limit: 10,
    });
  };

  const removeBookmark = async (slug: string) => {
    setIsRemoving(true);
    try {
      await jobApiRequest.removeBookmark(slug);
      // Optimistic update
      setJobs((current) => current.filter((j) => j.slug !== slug));
      setTotalCount((current) => Math.max(0, current - 1));
      if (quickViewJob?.slug === slug) {
        setQuickViewJob(null);
      }
      toastSuccess({ message: t("removed") });
      setPendingRemoveJobSlug(null);
      // Phát sự kiện đồng bộ
      if (typeof window !== "undefined") {
        window.dispatchEvent(
          new CustomEvent("frevia:bookmark-updated", {
            detail: { slug, isBookmarked: false },
          }),
        );
      }
      router.refresh();
    } catch {
      toastError({ message: t("removeFailed") });
    } finally {
      setIsRemoving(false);
    }
  };

  const isFiltered = Boolean(searchQuery.trim() || statusFilter !== "all");

  return (
    <div
      className={`flex flex-col bg-background font-sans ${
        embedded ? "min-h-0 flex-1" : "min-h-dvh"
      }`}
    >
      {!embedded && <Header role="FREELANCER" />}

      <main className="flex-1 font-sans">
        {/* Page Header */}
        <section className="border-b border-border bg-background">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            {!embedded && (
              <nav className="flex items-center gap-2 font-sans text-xs text-muted-foreground">
                <Link
                  href="/"
                  className="transition-colors hover:text-foreground font-medium"
                >
                  {tCommon("home")}
                </Link>
                <span className="text-muted-foreground/30">/</span>
                <span className="text-foreground font-medium">
                  {t("breadcrumb")}
                </span>
              </nav>
            )}

            <div
              className={`${
                !embedded ? "mt-4" : ""
              } flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between`}
            >
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
                  {t("count", { count: totalCount })}
                </span>
              </div>
            </div>

            {/* Filter and Search Bar (UC-12.01) */}
            <div className="mt-6 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              {/* Keyword Search */}
              <form
                onSubmit={handleSearchSubmit}
                className="relative flex-1 max-w-md"
              >
                <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={t("searchPlaceholder")}
                  className="h-10 w-full rounded-full border border-border bg-muted/40 pl-10 pr-10 text-xs sm:text-sm text-foreground placeholder:text-muted-foreground focus:border-[#4fae2e] focus:bg-background focus:outline-none focus:ring-1 focus:ring-[#4fae2e] transition-colors"
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <X className="size-4" />
                  </button>
                ) : null}
              </form>

              {/* Status and Sort Controls */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Status Filter Tabs */}
                <div className="flex flex-wrap items-center gap-1 rounded-full bg-muted/50 p-1 border border-border/60">
                  {STATUS_FILTERS.map((item) => (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => handleStatusFilterChange(item.value)}
                      className={`rounded-full px-3 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        statusFilter === item.value
                          ? "bg-[#4fae2e] text-white shadow-xs font-semibold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {item.key === "all"
                        ? t("allStatuses")
                        : (JOB_STATUS_KEYS as readonly string[]).includes(
                            item.key,
                          )
                          ? tStatus(item.key)
                          : item.key}
                    </button>
                  ))}
                </div>

                {/* Sort Toggle */}
                <button
                  type="button"
                  onClick={handleSortOrderToggle}
                  className="inline-flex h-9 items-center gap-1.5 rounded-full border border-border bg-background px-3.5 text-xs font-medium text-foreground hover:bg-muted transition-colors cursor-pointer"
                  title={sortOrder === "desc" ? t("sortNewest") : t("sortOldest")}
                >
                  <ArrowUpDown className="size-3.5 text-muted-foreground" />
                  <span>
                    {sortOrder === "desc" ? t("sortNewest") : t("sortOldest")}
                  </span>
                </button>

                {/* Per Page (Limit) Selector */}
                <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground pl-1">
                  <span>{t("perPage")}:</span>
                  {PAGE_SIZE_OPTIONS.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handlePageSizeChange(size)}
                      className={`h-7 min-w-7 rounded-md px-1.5 text-xs font-medium cursor-pointer transition-colors ${
                        pageSize === size
                          ? "bg-foreground text-background font-bold"
                          : "text-muted-foreground hover:text-foreground hover:bg-muted"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Area */}
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {/* Loading Transition Indicator */}
          {isPending ? (
            <div className="mb-4 flex items-center justify-center gap-2 py-4 text-xs font-medium text-muted-foreground animate-pulse">
              <Loader2 className="size-4 animate-spin text-[#4fae2e]" />
              <span>{tCommon("loading")}</span>
            </div>
          ) : null}

          {jobs.length ? (
            <div className={`space-y-3 ${isPending ? "opacity-60 transition-opacity" : ""}`}>
              {jobs.map((job, index) => {
                const availability = getAvailability(job);
                const isAvailableToApply =
                  job.status === "OPEN" && !availability.isClosed;

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
                      {/* Top Badges & Actions */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-3 py-0.5 text-xs font-semibold ${
                              availability.key === "closed"
                                ? "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                                : availability.key === "expired"
                                  ? "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-300"
                                  : availability.isExpiring
                                    ? "bg-red-50 text-red-600 dark:bg-red-950/50 dark:text-red-300"
                                    : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-300"
                            }`}
                          >
                            {t(availability.key)}
                          </span>
                          <span className="inline-flex items-center rounded-full bg-[#D0E1F8] text-[#0069D3] dark:bg-blue-950/60 dark:text-blue-300 px-3 py-0.5 text-xs font-semibold">
                            {(JOB_STATUS_KEYS as readonly string[]).includes(
                              job.status,
                            )
                              ? tStatus(job.status)
                              : job.status}
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground font-normal">
                            <Clock className="size-3.5" />
                            {formatPostedTime(job.createdAt)}
                          </span>
                        </div>

                        {/* Top Action Buttons (Quick View & Remove) */}
                        <div className="flex items-center gap-1.5">
                          {/* Quick View Button */}
                          <button
                            type="button"
                            onClick={() => setQuickViewJob(job)}
                            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F3F3F7] dark:bg-zinc-800 text-muted-foreground hover:text-foreground hover:bg-[#EAE9F0] dark:hover:bg-zinc-700 transition-colors cursor-pointer outline-none"
                            title={t("quickView")}
                          >
                            <Eye className="size-4" />
                          </button>

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => setPendingRemoveJobSlug(job.slug)}
                            className="flex size-9 shrink-0 items-center justify-center rounded-full bg-[#F3F3F7] dark:bg-zinc-800 text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors cursor-pointer outline-none"
                            title={t("removeAria")}
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </div>
                      </div>

                      {/* Job Title & Budget */}
                      <div className="mt-3 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
                        <Link
                          href={`${jobBaseUrl}/${job.slug}`}
                          className="text-base sm:text-lg font-bold text-foreground hover:text-[#4fae2e] transition-colors line-clamp-1"
                        >
                          {job.title}
                        </Link>
                        <div className="shrink-0 text-xs sm:text-sm font-semibold text-foreground">
                          {formatBudget(job)}{" "}
                          <span className="font-normal text-muted-foreground">
                            (
                            {(JOB_BUDGET_TYPE_KEYS as readonly string[]).includes(
                              job.budgetType,
                            )
                              ? tBudgetType(job.budgetType)
                              : job.budgetType}
                            )
                          </span>
                        </div>
                      </div>

                      {/* Location / Meta */}
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground font-normal">
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3.5" />
                          {t("remoteWorldwide")}
                        </span>
                      </div>
                    </div>

                    {/* Bottom Row: Skills & View Action */}
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between pt-2">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {job.skills?.length > 0 ? (
                          job.skills.map((skill) => (
                            <span
                              key={skill.skillId}
                              className="rounded-full bg-[#F1F0F5] dark:bg-zinc-800/80 px-3 py-1 text-xs font-medium text-foreground"
                            >
                              {skill.skill.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {t("generalProject")}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 self-start sm:self-auto">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setQuickViewJob(job)}
                          className="h-8 gap-1.5 rounded-full px-3 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                        >
                          <Eye className="size-3.5" />
                          <span>{t("quickView")}</span>
                        </Button>

                        {isAvailableToApply ? (
                          <Link
                            href={`${jobBaseUrl}/${job.slug}`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-[#4fae2e] text-white hover:bg-[#459928] px-4 py-2 text-xs font-semibold shadow-xs transition-all hover:translate-x-0.5"
                          >
                            <BriefcaseBusiness className="size-3.5" />
                            <span>{t("viewJob")}</span>
                            <ArrowRight className="size-3.5" />
                          </Link>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground font-medium italic">
                              {t("applicationsClosed")}
                            </span>
                            <Link
                              href={`${jobBaseUrl}/${job.slug}`}
                              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background hover:bg-muted text-foreground/80 px-3.5 py-1.5 text-xs font-semibold shadow-xs transition-all"
                            >
                              <span>{t("viewJob")}</span>
                              <ArrowRight className="size-3" />
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : isFiltered ? (
            /* Empty State for Filters */
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card/40 px-6 py-16 text-center font-sans"
            >
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Search className="size-6" />
              </div>
              <p className="text-base font-semibold text-foreground">
                {t("noFilterResultsTitle")}
              </p>
              <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
                {t("noFilterResultsDesc")}
              </p>
              <Button
                onClick={handleResetAllFilters}
                variant="outline"
                className="mt-6 rounded-full text-xs font-medium cursor-pointer"
              >
                {t("clearFilters")}
              </Button>
            </motion.div>
          ) : (
            /* Empty State when no bookmarks */
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card/40 px-6 py-20 text-center font-sans"
            >
              <div className="mb-4 flex size-12 items-center justify-center rounded-full bg-[#F1F0F5] dark:bg-zinc-800 text-muted-foreground">
                <Bookmark className="size-6" />
              </div>
              <p className="text-base font-semibold text-foreground">
                {t("emptyTitle")}
              </p>
              <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
                {t("emptyHint")}
              </p>
              <Button
                asChild
                className="mt-6 gap-2 rounded-full bg-[#4fae2e] text-xs font-medium text-white hover:bg-[#459928]"
              >
                <Link href={embedded ? "/freelancer/find-work" : "/find-work"}>
                  {t("browseJobs")}
                  <ArrowRight className="size-3.5" />
                </Link>
              </Button>
            </motion.div>
          )}

          {/* Pagination Controls */}
          {pagination.totalPages > 1 ? (
            <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-border pt-4 font-sans">
              <p className="font-sans text-xs text-muted-foreground">
                {t("showingCount", {
                  count: jobs.length,
                  total: pagination.total,
                })}
              </p>

              <div className="flex items-center gap-1.5 self-center sm:self-auto">
                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-full cursor-pointer"
                  disabled={pagination.page <= 1 || isPending}
                  onClick={() => navigateWithFilters({ page: pagination.page - 1 })}
                >
                  <ChevronLeft className="size-4" />
                </Button>

                {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                  .filter((p) => {
                    return (
                      p === 1 ||
                      p === pagination.totalPages ||
                      Math.abs(p - pagination.page) <= 1
                    );
                  })
                  .map((p, idx, arr) => {
                    const prev = arr[idx - 1];
                    const hasGap = prev && p - prev > 1;

                    return (
                      <span key={p} className="flex items-center">
                        {hasGap ? (
                          <span className="px-1 text-xs text-muted-foreground">
                            ...
                          </span>
                        ) : null}
                        <Button
                          variant={p === pagination.page ? "default" : "outline"}
                          size="sm"
                          className={`size-8 rounded-full p-0 text-xs cursor-pointer ${
                            p === pagination.page
                              ? "bg-[#4fae2e] text-white hover:bg-[#459928]"
                              : ""
                          }`}
                          disabled={isPending}
                          onClick={() => navigateWithFilters({ page: p })}
                        >
                          {p}
                        </Button>
                      </span>
                    );
                  })}

                <Button
                  variant="outline"
                  size="icon"
                  className="size-8 rounded-full cursor-pointer"
                  disabled={
                    pagination.page >= pagination.totalPages || isPending
                  }
                  onClick={() => navigateWithFilters({ page: pagination.page + 1 })}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      {/* Job Quick View Modal Dialog (UC-12.01.09) */}
      <Dialog
        open={Boolean(quickViewJob)}
        onOpenChange={(open) => !open && setQuickViewJob(null)}
      >
        <DialogContent className="max-h-[min(46rem,calc(100dvh-2rem))] overflow-y-auto sm:max-w-2xl rounded-[26px] border border-border bg-white dark:bg-zinc-900 p-6 shadow-2xl font-sans">
          {quickViewJob ? (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge
                    variant="outline"
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                      quickViewJob.status === "OPEN"
                        ? "border-emerald-500/40 bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-300"
                        : "border-zinc-500/30 bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    {tStatus(quickViewJob.status)}
                  </Badge>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="size-3.5" />
                    {formatPostedTime(quickViewJob.createdAt)}
                  </span>
                </div>
                <DialogTitle className="text-xl font-bold text-foreground">
                  {quickViewJob.title}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {t("quickViewDescription")}
                </DialogDescription>
              </DialogHeader>

              {/* Quick View Content Details */}
              <div className="my-4 space-y-4 text-xs sm:text-sm text-foreground">
                {/* Highlights grid */}
                <div className="grid grid-cols-2 gap-3 rounded-2xl bg-muted/40 p-3.5">
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {tCommon("budget", { defaultValue: "Budget" })}
                    </span>
                    <p className="font-semibold text-foreground mt-0.5">
                      {formatBudget(quickViewJob)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {tCommon("deadline", { defaultValue: "Deadline" })}
                    </span>
                    <p className="font-semibold text-foreground mt-0.5">
                      {formatDate(quickViewJob.deadline)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {tCommon("expires", { defaultValue: "Expires" })}
                    </span>
                    <p className="font-semibold text-foreground mt-0.5">
                      {formatDate(quickViewJob.expiryDate)}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground">
                      {t("client")}
                    </span>
                    <p className="font-semibold text-foreground mt-0.5">
                      Client #{quickViewJob.clientId}
                    </p>
                  </div>
                </div>

                {/* Description snippet */}
                <div>
                  <h4 className="font-semibold text-foreground mb-1.5">
                    {t("description")}
                  </h4>
                  <div className="max-h-56 overflow-y-auto rounded-xl border border-border p-3 text-xs leading-relaxed text-foreground/80 whitespace-pre-wrap bg-background/50">
                    {quickViewJob.description}
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h4 className="font-semibold text-foreground mb-1.5">
                    {t("skillsRequired")}
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {quickViewJob.skills?.length ? (
                      quickViewJob.skills.map((skill) => (
                        <span
                          key={skill.skillId}
                          className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-foreground"
                        >
                          {skill.skill.name}
                        </span>
                      ))
                    ) : (
                      <span className="text-xs text-muted-foreground">
                        {t("generalProject")}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Quick View Footer Actions */}
              <div className="mt-4 flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-2 border-t border-border pt-4">
                <Button
                  variant="outline"
                  onClick={() => setQuickViewJob(null)}
                  className="rounded-full text-xs cursor-pointer"
                >
                  {tCommon("close", { defaultValue: "Close" })}
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    asChild
                    className="rounded-full text-xs cursor-pointer"
                  >
                    <Link href={`${jobBaseUrl}/${quickViewJob.slug}`}>
                      {t("viewFullJob")}
                    </Link>
                  </Button>

                  {quickViewJob.status === "OPEN" ? (
                    <Button
                      asChild
                      className="rounded-full bg-[#4fae2e] text-white hover:bg-[#459928] text-xs font-semibold cursor-pointer"
                    >
                      <Link href={`${jobBaseUrl}/${quickViewJob.slug}`}>
                        {t("applyJob")}
                        <ArrowRight className="size-3.5 ml-1" />
                      </Link>
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground font-medium italic">
                      {t("applicationsClosed")}
                    </span>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Modern Capsule Remove Alert Dialog */}
      <AlertDialog
        open={pendingRemoveJobSlug !== null}
        onOpenChange={(open) => !open && setPendingRemoveJobSlug(null)}
      >
        <AlertDialogContent className="max-w-sm rounded-[26px] border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 p-5 shadow-2xl font-sans">
          <div className="flex flex-col gap-3">
            <div className="px-1">
              <AlertDialogTitle className="text-base font-bold text-foreground font-sans">
                {t("removeTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-1 text-xs text-muted-foreground leading-normal font-sans">
                {t("removeHint")}
              </AlertDialogDescription>
            </div>

            <div className="mt-1 flex flex-col gap-2">
              <button
                type="button"
                disabled={isRemoving}
                onClick={() =>
                  pendingRemoveJobSlug && void removeBookmark(pendingRemoveJobSlug)
                }
                className="group flex w-full items-center justify-between rounded-full px-3.5 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 cursor-pointer transition-all duration-200 outline-none disabled:opacity-50"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400 shadow-xs transition-transform group-hover:scale-105">
                    {isRemoving ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </div>
                  <span className="text-xs font-semibold">
                    {t("removeBookmark")}
                  </span>
                </div>
                <ChevronRight className="size-3.5 text-red-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <AlertDialogCancel
                disabled={isRemoving}
                className="group flex w-full items-center justify-between rounded-full px-3.5 py-2.5 bg-[#F1F0F5] hover:bg-[#EAE9F0] dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-foreground cursor-pointer transition-all duration-200 outline-none border-0 m-0 disabled:opacity-50 h-auto"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white dark:bg-zinc-700 text-muted-foreground shadow-xs transition-transform group-hover:scale-105">
                    <X className="size-3.5" />
                  </div>
                  <span className="text-xs font-medium">
                    {tCommon("cancel")}
                  </span>
                </div>
                <ChevronRight className="size-3.5 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
              </AlertDialogCancel>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {!embedded && <Footer />}
    </div>
  );
}
