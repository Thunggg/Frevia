"use client";

import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bookmark,
  BookmarkCheck,
  Briefcase,
  CheckCircle2,
  Edit2,
  Ellipsis,
  Eye,
  Inbox,
  Loader2,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  X,
  XCircle,
} from "@/components/icons";

import { accountProfileApi } from "@/apiRequests/account-profile";
import jobApiRequest from "@/apiRequests/job";
import { ApiFail } from "@/lib/http";
import { useActionPermission } from "@/hooks/use-action-permission";

import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@repo/ui/components/shadcn/alert-dialog";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/shadcn/dropdown-menu";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { VerificationStatus, type JobType } from "@shared/types";

import { JobPagination } from "@/app/(freelancer)/_components/job-pagination";
import { PostJobForm } from "./post-job-form";

type JobListProps = {
  initialJobs: JobType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  overviewCounts?: {
    open: number;
    inProgress: number;
    completed: number;
    draft: number;
  };
  initialSearch?: string;
  initialStatus?: string;
};

type TabFilterType =
  | "ALL"
  | "OPEN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CLOSED"
  | "DRAFT";

export function JobList({
  initialJobs,
  pagination,
  overviewCounts,
  initialSearch = "",
  initialStatus,
}: JobListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("jobsList");
  const format = useFormatter();

  const formatRelativeDays = (dateInput: Date | string | null): string => {
    if (!dateInput) return t("relativeJustNow");
    const date = new Date(dateInput);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays <= 0) return t("relativeToday");
    if (diffDays === 1) return t("relativeOneDayAgo");
    return t("relativeDaysAgo", { count: diffDays });
  };
  const { can, isLoading: isPermissionLoading } = useActionPermission();

  const canViewList = can("GET", "/api/manage-jobs");
  const canCreate = can("POST", "/api/manage-jobs");
  const canDelete = can("DELETE", "/api/manage-jobs/:id");
  const canPublish = can("PATCH", "/api/manage-jobs/:id/publish");
  const canClose = can("PATCH", "/api/manage-jobs/:id/close");
  const canReopen = can("PATCH", "/api/manage-jobs/:id/reopen");

  const [jobs, setJobs] = useState<JobType[]>(initialJobs);
  const [paginationState, setPaginationState] = useState(pagination);
  const [activeTab, setActiveTab] = useState<TabFilterType>(
    (initialStatus as TabFilterType) || "ALL",
  );
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(initialSearch);
  const [isSearching, setIsSearching] = useState(false);
  const [bookmarkedJobIds, setBookmarkedJobIds] = useState<Set<number>>(
    new Set(),
  );

  const isFirstMount = useRef(true);
  const searchParamsRef = useRef(searchParams);
  searchParamsRef.current = searchParams;
  const limitRef = useRef(pagination.limit);
  limitRef.current = paginationState.limit;

  // Giữ jobs và pagination đồng bộ khi initialJobs/pagination từ server thay đổi
  useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

  useEffect(() => {
    setPaginationState(pagination);
  }, [pagination]);

  // Debounce 400ms: reset timer khi người dùng tiếp tục gõ phím
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const isDebouncing = searchQuery !== debouncedSearch;
  const isBusy = isDebouncing || isSearching;

  // Khi debouncedSearch hoặc activeTab thay đổi: gọi API và cập nhật URL
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }

    const trimmed = debouncedSearch.trim();
    const currentSearch = searchParamsRef.current.get("search") || "";

    // 1. Cập nhật query param trên URL
    if (trimmed !== currentSearch) {
      const params = new URLSearchParams(searchParamsRef.current.toString());
      if (trimmed) {
        params.set("search", trimmed);
      } else {
        params.delete("search");
      }
      params.delete("page");
      router.replace(`?${params.toString()}`, { scroll: false });
    }

    // 2. Gọi trực tiếp API getClientJobs với debounce 400ms để hiển thị kết quả và Network tab
    let isCancelled = false;
    const fetchJobs = async () => {
      setIsSearching(true);
      try {
        const res = await jobApiRequest.getClientJobs({
          search: trimmed || undefined,
          status: activeTab !== "ALL" ? activeTab : undefined,
          page: 1,
          limit: limitRef.current,
        });
        if (!isCancelled && res.data) {
          setJobs(res.data.data);
          if (res.data.pagination) {
            setPaginationState(res.data.pagination);
          }
        }
      } catch (error) {
        console.error("Lỗi tìm kiếm công việc:", error);
      } finally {
        if (!isCancelled) {
          setIsSearching(false);
        }
      }
    };

    void fetchJobs();

    return () => {
      isCancelled = true;
    };
  }, [debouncedSearch, activeTab, router]);

  const handleTabChange = (tab: TabFilterType) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "ALL") {
      params.delete("status");
    } else {
      params.set("status", tab);
    }
    params.delete("page");
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handlePageChange = async (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(newPage));
    router.replace(`?${params.toString()}`, { scroll: false });

    setIsSearching(true);
    try {
      const res = await jobApiRequest.getClientJobs({
        search: debouncedSearch.trim() || undefined,
        status: activeTab !== "ALL" ? activeTab : undefined,
        page: newPage,
        limit: paginationState.limit,
      });
      if (res.data) {
        setJobs(res.data.data);
        if (res.data.pagination) {
          setPaginationState(res.data.pagination);
        }
      }
    } catch (err) {
      console.error("Lỗi chuyển trang:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const handlePageSizeChange = async (newLimit: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", String(newLimit));
    params.set("page", "1");
    router.replace(`?${params.toString()}`, { scroll: false });

    setIsSearching(true);
    try {
      const res = await jobApiRequest.getClientJobs({
        search: debouncedSearch.trim() || undefined,
        status: activeTab !== "ALL" ? activeTab : undefined,
        page: 1,
        limit: newLimit,
      });
      if (res.data) {
        setJobs(res.data.data);
        if (res.data.pagination) {
          setPaginationState(res.data.pagination);
        }
      }
    } catch (err) {
      console.error("Lỗi đổi số lượng hiển thị:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobType | null>(null);
  const [pendingDeleteJobId, setPendingDeleteJobId] = useState<number | null>(
    null,
  );
  const [pendingPublishJobId, setPendingPublishJobId] = useState<number | null>(
    null,
  );
  const [isPublishing, setIsPublishing] = useState(false);
  const [isKYCDialogOpen, setIsKYCDialogOpen] = useState(false);
  const [isCheckingKyc, setIsCheckingKyc] = useState(false);

  const handleCreateJobClick = async () => {
    if (isCheckingKyc) return;
    setIsCheckingKyc(true);
    try {
      const status = await accountProfileApi.getIdentityStatus();
      if (status.data?.status !== VerificationStatus.APPROVED) {
        setIsKYCDialogOpen(true);
        return;
      }
    } catch {
      // Fail-open nếu backend lỗi; POST /manage-jobs vẫn chặn ở server.
    } finally {
      setIsCheckingKyc(false);
    }
    router.push("/client/jobs/new");
  };

  const toggleBookmark = (jobId: number) => {
    setBookmarkedJobIds((prev) => {
      const next = new Set(prev);
      if (next.has(jobId)) {
        next.delete(jobId);
      } else {
        next.add(jobId);
      }
      return next;
    });
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setDebouncedSearch("");
    const params = new URLSearchParams(searchParams.toString());
    params.delete("search");
    params.delete("page");
    router.replace(`?${params.toString()}`, { scroll: false });

    if (debouncedSearch === "") {
      void jobApiRequest
        .getClientJobs({
          status: activeTab !== "ALL" ? activeTab : undefined,
          page: 1,
          limit: paginationState.limit,
        })
        .then((res) => {
          if (res.data) {
            setJobs(res.data.data);
            if (res.data.pagination) setPaginationState(res.data.pagination);
          }
        });
    }
  };

  const draftCount = overviewCounts?.draft ?? 0;
  const openCount = overviewCounts?.open ?? 0;
  const inProgressCount = overviewCounts?.inProgress ?? 0;
  const completedCount = overviewCounts?.completed ?? 0;

  // Filtered jobs based on tab and search
  const filteredJobs = useMemo(() => {
    let list = jobs;

    if (activeTab === "DRAFT") {
      list = list.filter((j) => j.status === "DRAFT");
    } else if (activeTab === "OPEN") {
      list = list.filter((j) => j.status === "OPEN");
    } else if (activeTab === "IN_PROGRESS") {
      list = list.filter((j) => j.status === "IN_PROGRESS");
    } else if (activeTab === "COMPLETED") {
      list = list.filter((j) => j.status === "COMPLETED");
    } else if (activeTab === "CLOSED") {
      list = list.filter(
        (j) => j.status === "CLOSED" || j.status === "CANCELLED",
      );
    }

    if (debouncedSearch.trim()) {
      const q = debouncedSearch.toLowerCase().trim();
      list = list.filter((j) => j.title.toLowerCase().includes(q));
    }

    return list;
  }, [jobs, activeTab, debouncedSearch]);

  const saveJob = (saved: JobType) => {
    setJobs((prev) => {
      const idx = prev.findIndex((j) => j.id === saved.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = saved;
        return next;
      }
      return [saved, ...prev];
    });
    setEditingJob(null);
  };

  const confirmPublishJob = async () => {
    if (!pendingPublishJobId) return;
    if (!canPublish) {
      toastError({ message: t("noPermissionAction") });
      return;
    }
    setIsPublishing(true);
    try {
      const response = await jobApiRequest.publishJob(pendingPublishJobId);
      if (!response.success) throw new Error();
      setJobs((current) =>
        current.map((job) =>
          job.id === pendingPublishJobId ? { ...job, status: "OPEN" } : job,
        ),
      );
      toastSuccess({ message: t("published") });
      setPendingPublishJobId(null);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiFail
          ? (error.response?.error?.message ?? error.message)
          : t("publishFailed");
      toastError({ message: message || t("publishFailed") });
    } finally {
      setIsPublishing(false);
    }
  };

  const closeJob = async (id: number) => {
    if (!canClose) {
      toastError({ message: t("noPermissionAction") });
      return;
    }
    try {
      const response = await jobApiRequest.closeJob(id);
      if (!response.success) throw new Error();
      setJobs((current) =>
        current.map((job) =>
          job.id === id ? { ...job, status: "CLOSED" } : job,
        ),
      );
      toastSuccess({ message: t("closed") });
      router.refresh();
    } catch {
      toastError({ message: t("closeFailed") });
    }
  };

  const reopenJob = async (id: number) => {
    if (!canReopen) {
      toastError({ message: t("noPermissionAction") });
      return;
    }
    try {
      const response = await jobApiRequest.reopenJob(id);
      if (!response.success) throw new Error();
      setJobs((current) =>
        current.map((job) => (job.id === id ? { ...job, status: "OPEN" } : job)),
      );
      toastSuccess({ message: t("reopened") });
      router.refresh();
    } catch {
      toastError({ message: t("reopenFailed") });
    }
  };

  const deleteJob = async () => {
    if (pendingDeleteJobId === null) return;
    const id = pendingDeleteJobId;
    setPendingDeleteJobId(null);
    if (!canDelete) {
      toastError({ message: t("noPermissionAction") });
      return;
    }
    try {
      await jobApiRequest.deleteJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
      toastSuccess({ message: t("deleted") });
      router.refresh();
    } catch {
      toastError({ message: t("deleteFailed") });
    }
  };

  if (!isPermissionLoading && !canViewList) {
    return (
      <div className="min-h-full bg-background font-sans p-6 sm:p-10">
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground">
          <Briefcase className="size-12 mx-auto mb-4 text-muted-foreground/60" />
          <h2 className="text-lg font-semibold text-foreground mb-1">
            {t("accessDenied")}
          </h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-background font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-[calc(6rem+env(safe-area-inset-bottom))]">
        {/* ── Top Header Bar ── */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              {t("managePostedJobs")}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
              {t("managePostedJobsSubtitle")}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* Kho bản nháp button */}
            <Button
              type="button"
              variant={activeTab === "DRAFT" ? "secondary" : "outline"}
              onClick={() =>
                handleTabChange(activeTab === "DRAFT" ? "ALL" : "DRAFT")
              }
              className="rounded-lg text-xs sm:text-sm font-medium h-9 px-3.5 cursor-pointer"
            >
              <Inbox className="mr-1.5 size-4 text-muted-foreground" />
              <span>{t("draftBox", { count: draftCount })}</span>
            </Button>

            {/* + Đăng việc mới button */}
            {canCreate && (
              <Button
                type="button"
                disabled={isCheckingKyc}
                onClick={() => void handleCreateJobClick()}
                className="rounded-lg bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs sm:text-sm font-medium h-9 px-4 cursor-pointer"
              >
                {isCheckingKyc ? (
                  <Loader2 className="mr-1.5 size-4 animate-spin" />
                ) : (
                  <Plus className="mr-1.5 size-4" />
                )}
                <span>{t("postNewJob")}</span>
              </Button>
            )}
          </div>
        </div>

        {/* ── 3 Overview Statistics Cards (Clean, no decorative icons) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          <div className="rounded-xl border border-border bg-card p-5">
            <span className="text-xs font-medium text-muted-foreground">
              {t("statActive")}
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold tabular-nums text-foreground">
                {openCount < 10 ? `0${openCount}` : openCount}
              </span>
              <span className="text-xs text-muted-foreground">
                {t("statActiveUnit")}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <span className="text-xs font-medium text-muted-foreground">
              {t("statInProgress")}
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold tabular-nums text-foreground">
                {inProgressCount < 10 ? `0${inProgressCount}` : inProgressCount}
              </span>
              <span className="text-xs text-muted-foreground">
                {t("statInProgressUnit")}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-border bg-card p-5">
            <span className="text-xs font-medium text-muted-foreground">
              {t("statCompleted")}
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="text-2xl sm:text-3xl font-bold tabular-nums text-foreground">
                {completedCount < 10 ? `0${completedCount}` : completedCount}
              </span>
              <span className="text-xs text-muted-foreground">
                {t("statCompletedUnit")}
              </span>
            </div>
          </div>
        </div>

        {/* ── Tabs & Search Filter Row ── */}
        <div className="mt-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-3 border-b border-border">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {[
              { id: "ALL" as const, label: t("tabAll") },
              { id: "OPEN" as const, label: t("tabOpen") },
              { id: "IN_PROGRESS" as const, label: t("tabInProgress") },
              { id: "COMPLETED" as const, label: t("tabCompleted") },
              { id: "CLOSED" as const, label: t("tabClosed") },
              { id: "DRAFT" as const, label: t("tabDraft") },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-muted text-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchJobsPlaceholder")}
              className="w-full rounded-lg border border-border bg-background pl-9 pr-8 py-1.5 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#0069D3]"
            />
            {isBusy ? (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <Loader2 className="size-3.5 animate-spin text-muted-foreground" />
              </div>
            ) : searchQuery ? (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                title={t("clearSearch")}
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        {/* ── Job Cards List ── */}
        <div className="mt-5 space-y-3">
          {isBusy && jobs.length === 0 ? (
            <div className="rounded-xl border border-border bg-card py-14 text-center text-muted-foreground">
              <Loader2 className="size-6 mx-auto mb-2.5 animate-spin text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{t("searching")}</p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="rounded-xl border border-border bg-card py-14 text-center text-muted-foreground">
              <Briefcase className="size-10 mx-auto mb-3 text-muted-foreground/40" />
              <h3 className="text-sm font-semibold text-foreground mb-1">
                {t("noJobsTitle")}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {t("noJobsHint")}
              </p>
            </div>
          ) : (
            filteredJobs.map((job) => {
              const isOpen = job.status === "OPEN";
              const isDraft = job.status === "DRAFT";
              const isInProgress = job.status === "IN_PROGRESS";
              const isCompleted = job.status === "COMPLETED";
              const isClosed =
                job.status === "CLOSED" || job.status === "CANCELLED";

              const isBookmarked = bookmarkedJobIds.has(job.id);
              const relativeDate = formatRelativeDays(job.createdAt);

              const statusTextColor =
                isOpen || isInProgress
                  ? "text-[#0069D3] dark:text-blue-400"
                  : isCompleted
                    ? "text-foreground"
                    : job.status === "CANCELLED"
                      ? "text-destructive"
                      : "text-muted-foreground";

              const statusText = isOpen
                ? t("statusOpen")
                : isInProgress
                  ? t("statusInProgress")
                  : isDraft
                    ? t("statusDraft")
                    : isCompleted
                      ? t("statusCompleted")
                      : job.status === "CANCELLED"
                        ? t("statusCancelled")
                        : t("statusClosed");

              const formattedBudget =
                job.budgetMin && job.budgetMax && job.budgetMin !== job.budgetMax
                  ? `$${Number(job.budgetMin).toLocaleString()} - $${Number(job.budgetMax).toLocaleString()}`
                  : job.budgetMax
                    ? `$${Number(job.budgetMax).toLocaleString()}`
                    : job.budgetMin
                      ? `$${Number(job.budgetMin).toLocaleString()}`
                      : t("budgetNegotiable");

              const proposalsCount = job.proposalsCount ?? 0;
              const isEditable =
                job.status !== "IN_PROGRESS" && job.status !== "COMPLETED";

              return (
                <div
                  key={job.id}
                  className="rounded-xl border border-border bg-card p-5 space-y-3"
                >
                  {/* Top Status & Code Header Row */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5 flex-wrap text-xs text-muted-foreground">
                      <span
                        className={`inline-flex items-center gap-1.5 font-semibold ${statusTextColor}`}
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                        <span>{statusText}</span>
                      </span>
                      <span className="text-muted-foreground/40">•</span>
                      <span>{t("jobCodeLabel", { code: job.id })}</span>
                      <span className="text-muted-foreground/40">•</span>
                      <span>{t("postedDaysAgo", { days: relativeDate })}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleBookmark(job.id)}
                        className="size-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        {isBookmarked ? (
                          <BookmarkCheck className="size-4 text-[#0069D3]" />
                        ) : (
                          <Bookmark className="size-4" />
                        )}
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <Ellipsis className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 rounded-xl p-1"
                        >
                          <DropdownMenuItem asChild>
                            <Link
                              href={`/client/jobs/${job.id}`}
                              className="flex items-center gap-2 text-xs font-medium cursor-pointer"
                            >
                              <Eye className="size-3.5" />
                              <span>{t("viewDetail")}</span>
                            </Link>
                          </DropdownMenuItem>

                          {isDraft && canPublish && (
                            <DropdownMenuItem
                              onClick={() => setPendingPublishJobId(job.id)}
                              className="flex items-center gap-2 text-xs font-medium text-[#0069D3] cursor-pointer"
                            >
                              <TrendingUp className="size-3.5" />
                              <span>{t("publish")}</span>
                            </DropdownMenuItem>
                          )}

                          {isOpen && canClose && (
                            <DropdownMenuItem
                              onClick={() => void closeJob(job.id)}
                              className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer"
                            >
                              <XCircle className="size-3.5" />
                              <span>{t("close")}</span>
                            </DropdownMenuItem>
                          )}

                          {isClosed && canReopen && (
                            <DropdownMenuItem
                              onClick={() => void reopenJob(job.id)}
                              className="flex items-center gap-2 text-xs font-medium text-[#0069D3] cursor-pointer"
                            >
                              <CheckCircle2 className="size-3.5" />
                              <span>{t("reopen")}</span>
                            </DropdownMenuItem>
                          )}

                          {isEditable && (
                            <DropdownMenuItem
                              onClick={() => {
                                setEditingJob(job);
                                setIsFormOpen(true);
                              }}
                              className="flex items-center gap-2 text-xs font-medium cursor-pointer"
                            >
                              <Edit2 className="size-3.5" />
                              <span>{t("edit")}</span>
                            </DropdownMenuItem>
                          )}

                          {job.status !== "IN_PROGRESS" && canDelete && (
                            <DropdownMenuItem
                              onClick={() => setPendingDeleteJobId(job.id)}
                              className="flex items-center gap-2 text-xs font-medium text-destructive cursor-pointer"
                            >
                              <Trash2 className="size-3.5" />
                              <span>{t("delete")}</span>
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  {/* Job Title */}
                  <div>
                    <Link
                      href={`/client/jobs/${job.id}`}
                      className="text-base sm:text-lg font-semibold text-foreground hover:text-[#0069D3] leading-snug line-clamp-2"
                    >
                      {job.title}
                    </Link>
                  </div>

                  {/* Clean Inline Meta Info (No decorative icons) */}
                  <div className="flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-muted-foreground">
                    <span className="font-medium text-foreground">
                      {t("fixedPriceLabel", { price: formattedBudget })}
                    </span>
                    <span className="text-muted-foreground/40">•</span>
                    <span>
                      {job.hiringType === "SINGLE"
                        ? t("hiringSingle")
                        : t("hiringMultiple", {
                            count: job.positionsRequired || 1,
                          })}
                    </span>
                    {job.deadline && (
                      <>
                        <span className="text-muted-foreground/40">•</span>
                        <span>
                          {t("deadlineLabel", {
                            date: format.dateTime(new Date(job.deadline), {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }),
                          })}
                        </span>
                      </>
                    )}
                    {job.expiryDate && (
                      <>
                        <span className="text-muted-foreground/40">•</span>
                        <span>
                          {t("expiryLabel", {
                            date: format.dateTime(new Date(job.expiryDate), {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }),
                          })}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Description Snippet */}
                  {job.description ? (
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {job.description.replace(/<[^>]+>/g, "")}
                    </p>
                  ) : null}

                  {/* Bottom Row: Skills & Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-border">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {job.skills && job.skills.length > 0
                        ? job.skills.map((s, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 text-xs rounded-md bg-muted text-muted-foreground"
                            >
                              {s.skill.name}
                            </span>
                          ))
                        : null}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant={proposalsCount > 0 ? "outline" : "default"}
                        size="sm"
                        asChild
                        className={
                          proposalsCount > 0
                            ? "rounded-lg px-3.5 h-8 text-xs font-medium cursor-pointer"
                            : "rounded-lg bg-[#0069D3] hover:bg-[#005bb8] text-white px-4 h-8 text-xs font-medium cursor-pointer"
                        }
                      >
                        <Link href={`/client/jobs/${job.id}`}>
                          <span>{t("viewDetail")}</span>
                        </Link>
                      </Button>

                      {isDraft && canPublish && (
                        <Button
                          size="sm"
                          onClick={() => setPendingPublishJobId(job.id)}
                          className="rounded-lg bg-[#0069D3] hover:bg-[#005bb8] text-white px-4 h-8 text-xs font-medium cursor-pointer"
                        >
                          <span>{t("publish")}</span>
                        </Button>
                      )}

                      {proposalsCount > 0 && (
                        <Button
                          size="sm"
                          asChild
                          className="rounded-lg bg-[#0069D3] hover:bg-[#005bb8] text-white px-4 h-8 text-xs font-medium cursor-pointer"
                        >
                          <Link href={`/client/jobs/${job.id}/proposals`}>
                            <span>
                              {t("viewProposalsCount", {
                                count: proposalsCount,
                              })}
                            </span>
                          </Link>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        <JobPagination
          currentPage={paginationState.page}
          totalPages={paginationState.totalPages}
          totalResults={paginationState.total}
          pageSize={paginationState.limit}
          onPageChange={(newPage) => void handlePageChange(newPage)}
          onPageSizeChange={(newLimit) => void handlePageSizeChange(newLimit)}
          isLoading={isBusy}
        />
      </div>

      {/* Edit Post Job Dialog */}
      {isFormOpen && (
        <PostJobForm
          job={editingJob ?? undefined}
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setEditingJob(null);
          }}
          onSaved={saveJob}
        />
      )}

      {/* Delete Job Confirmation */}
      <AlertDialog
        open={pendingDeleteJobId !== null}
        onOpenChange={(open) => !open && setPendingDeleteJobId(null)}
      >
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("deleteHint")}</AlertDialogDescription>
          <div className="mt-4 flex justify-end gap-2">
            <AlertDialogCancel className="rounded-xl">
              {t("cancel")}
            </AlertDialogCancel>
            <Button
              variant="destructive"
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white cursor-pointer"
              onClick={() => void deleteJob()}
            >
              {t("deleteJob")}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish Job Confirmation */}
      <AlertDialog
        open={pendingPublishJobId !== null}
        onOpenChange={(open) => !open && setPendingPublishJobId(null)}
      >
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogTitle>{t("publishConfirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("publishConfirmDesc")}
          </AlertDialogDescription>
          <div className="mt-4 flex justify-end gap-2">
            <AlertDialogCancel className="rounded-xl">
              {t("cancel")}
            </AlertDialogCancel>
            <Button
              disabled={isPublishing}
              className="rounded-xl bg-[#0069D3] hover:bg-[#005bb8] text-white cursor-pointer"
              onClick={() => void confirmPublishJob()}
            >
              {isPublishing ? t("publishing") : t("confirmPublish")}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>

      {/* KYC Verification Required */}
      <AlertDialog open={isKYCDialogOpen} onOpenChange={setIsKYCDialogOpen}>
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogTitle>{t("kycDialog.title")}</AlertDialogTitle>
          <AlertDialogDescription>
            {t("kycDialog.description")}
          </AlertDialogDescription>
          <div className="mt-4 flex justify-end gap-2">
            <AlertDialogCancel className="rounded-xl">
              {t("kycDialog.cancel")}
            </AlertDialogCancel>
            <Button
              className="rounded-xl bg-[#0069D3] hover:bg-[#005bb8] text-white cursor-pointer"
              onClick={() => {
                setIsKYCDialogOpen(false);
                router.push("/client/profile?tab=identity");
              }}
            >
              {t("kycDialog.confirm")}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
