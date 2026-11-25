"use client";

import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "motion/react";
import {
  Bookmark,
  BookmarkCheck,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  CreditCard,
  Edit2,
  Ellipsis,
  Eye,
  Inbox,
  Loader2,
  Megaphone,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  User,
  UserCheck,
  Users,
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

import { PostJobForm } from "./post-job-form";

type JobListProps = {
  initialJobs: JobType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  overviewJobs?: JobType[];
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
  overviewJobs = [],
  initialSearch = "",
  initialStatus,
}: JobListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const t = useTranslations("jobsList");
  const tCommon = useTranslations("common");
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
          limit: 10,
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
        limit: 10,
      });
      if (res.data) {
        setJobs(res.data);
        if (res.pagination) {
          setPaginationState(res.pagination);
        }
      }
    } catch (err) {
      console.error("Lỗi chuyển trang:", err);
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
          limit: 10,
        })
        .then((res) => {
          if (res.data) {
            setJobs(res.data);
            if (res.pagination) setPaginationState(res.pagination);
          }
        });
    }
  };

  // Metric counts based on overview stats jobs
  const statsSource = overviewJobs.length > 0 ? overviewJobs : jobs;

  const draftJobs = useMemo(
    () => statsSource.filter((j) => j.status === "DRAFT"),
    [statsSource],
  );
  const openJobs = useMemo(
    () => statsSource.filter((j) => j.status === "OPEN"),
    [statsSource],
  );
  const inProgressJobs = useMemo(
    () => statsSource.filter((j) => j.status === "IN_PROGRESS"),
    [statsSource],
  );
  const completedJobs = useMemo(
    () => statsSource.filter((j) => j.status === "COMPLETED"),
    [statsSource],
  );
  const closedJobs = useMemo(
    () =>
      statsSource.filter((j) => j.status === "CLOSED" || j.status === "CANCELLED"),
    [statsSource],
  );

  const draftCount = draftJobs.length;
  const openCount = openJobs.length;
  const inProgressCount = inProgressJobs.length;
  const completedCount = completedJobs.length;
  const closedCount = closedJobs.length;

  const totalProposals = useMemo(
    () => statsSource.reduce((acc, j) => acc + (j.proposalsCount ?? 0), 0),
    [statsSource],
  );

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
    <div className="min-h-full bg-[#F9FAFC] dark:bg-zinc-950 font-sans pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {/* ── Top Header Bar ── */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {t("managePostedJobs")}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1.5 max-w-2xl leading-relaxed">
              {t("managePostedJobsSubtitle")}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {/* Kho bản nháp button */}
            <button
              type="button"
              onClick={() => handleTabChange(activeTab === "DRAFT" ? "ALL" : "DRAFT")}
              className={`rounded-xl border px-4 py-2.5 text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer transition-all shadow-xs ${
                activeTab === "DRAFT"
                  ? "border-[#0069D3] bg-blue-50 text-[#0069D3] dark:bg-blue-950/40 dark:text-blue-300"
                  : "border-border/80 bg-white hover:bg-muted/70 text-foreground dark:bg-zinc-900"
              }`}
            >
              <Inbox className="size-4 text-muted-foreground" />
              <span>{t("draftBox", { count: draftCount })}</span>
            </button>

            {/* + Đăng việc mới button */}
            {canCreate && (
              <Button
                type="button"
                disabled={isCheckingKyc}
                onClick={() => void handleCreateJobClick()}
                className="rounded-xl bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs sm:text-sm font-semibold px-5 py-2.5 shadow-sm shadow-blue-500/20 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                {isCheckingKyc ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                <span>{t("postNewJob")}</span>
              </Button>
            )}
          </div>
        </div>

        {/* ── 4 Overview Statistics Cards (Dữ liệu thực tế của hệ thống) ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {/* Card 1: Đang tuyển (Active) */}
          <div className="rounded-2xl border border-border/80 bg-white dark:bg-zinc-900 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("statActive")}
              </span>
              <div className="size-9 rounded-xl bg-blue-50 text-[#0069D3] dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center">
                <Megaphone className="size-4.5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-foreground tracking-tight">
                {openCount < 10 ? `0${openCount}` : openCount}
              </span>
              <span className="text-xs text-muted-foreground font-semibold">
                {t("statActiveUnit")}
              </span>
            </div>
          </div>

          {/* Card 2: Tổng đề xuất */}
          <div className="rounded-2xl border border-border/80 bg-white dark:bg-zinc-900 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("statProposals")}
              </span>
              <div className="size-9 rounded-xl bg-blue-50 text-[#0069D3] dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center">
                <UserCheck className="size-4.5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-foreground tracking-tight">
                {totalProposals < 10 ? `0${totalProposals}` : totalProposals}
              </span>
              <span className="text-xs text-muted-foreground font-semibold">
                {t("statProposalsUnit")}
              </span>
            </div>
          </div>

          {/* Card 3: Đang thực hiện */}
          <div className="rounded-2xl border border-border/80 bg-white dark:bg-zinc-900 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("statInProgress")}
              </span>
              <div className="size-9 rounded-xl bg-blue-50 text-[#0069D3] dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center">
                <Clock className="size-4.5" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-foreground tracking-tight">
                {inProgressCount < 10 ? `0${inProgressCount}` : inProgressCount}
              </span>
              <span className="text-xs text-muted-foreground font-semibold">
                {t("statInProgressUnit")}
              </span>
            </div>
          </div>

          {/* Card 4: Đã hoàn thành */}
          <div className="rounded-2xl border border-border/80 bg-white dark:bg-zinc-900 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("statCompleted")}
              </span>
              <div className="size-9 rounded-xl bg-blue-50 text-[#0069D3] dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center">
                <CheckCircle2 className="size-4.5 text-blue-600" />
              </div>
            </div>
            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-foreground tracking-tight">
                {completedCount < 10 ? `0${completedCount}` : completedCount}
              </span>
              <span className="text-xs text-muted-foreground font-semibold">
                {t("statCompletedUnit")}
              </span>
            </div>
          </div>
        </div>

        {/* ── Tabs & Search Filter Row ── */}
        <div className="mt-7 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-1.5 rounded-2xl bg-white dark:bg-zinc-900 border border-border/80 shadow-xs">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto p-0.5 no-scrollbar">
            {[
              { id: "ALL" as const, label: t("tabAll"), count: statsSource.length },
              { id: "OPEN" as const, label: t("tabOpen"), count: openCount },
              {
                id: "IN_PROGRESS" as const,
                label: t("tabInProgress"),
                count: inProgressCount,
              },
              {
                id: "COMPLETED" as const,
                label: t("tabCompleted"),
                count: completedCount,
              },
              {
                id: "CLOSED" as const,
                label: t("tabClosed"),
                count: closedCount,
              },
              {
                id: "DRAFT" as const,
                label: t("tabDraft"),
                count: draftCount,
              },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all shrink-0 ${
                    isActive
                      ? "bg-[#F0F5FC] text-[#0069D3] dark:bg-blue-950/60 dark:text-blue-300 shadow-xs"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span
                      className={`size-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                        isActive
                          ? "bg-blue-100 text-[#0069D3] dark:bg-blue-900 dark:text-blue-200"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <Search className="size-4 text-muted-foreground absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("searchJobsPlaceholder")}
              className="w-full rounded-xl border border-border/80 bg-[#F9FAFC] dark:bg-zinc-800/60 pl-9 pr-8 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#0069D3] transition-colors"
            />
            {isBusy ? (
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none">
                <Loader2 className="size-3.5 animate-spin text-[#0069D3]" />
              </div>
            ) : searchQuery ? (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer p-0.5 rounded-full"
                title={t("clearSearch")}
              >
                <X className="size-3.5" />
              </button>
            ) : null}
          </div>
        </div>

        {/* ── Job Cards List ── */}
        <div className="mt-6 space-y-4">
          {isBusy && jobs.length === 0 ? (
            <div className="rounded-2xl border border-border/80 bg-white dark:bg-zinc-900 p-12 text-center text-muted-foreground">
              <Loader2 className="size-8 mx-auto mb-3 animate-spin text-[#0069D3]" />
              <p className="text-xs text-muted-foreground font-medium">
                {t("searching")}
              </p>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="rounded-2xl border border-border/80 bg-white dark:bg-zinc-900 p-12 text-center text-muted-foreground">
              <Briefcase className="size-12 mx-auto mb-3 text-muted-foreground/40" />
              <h3 className="text-base font-semibold text-foreground mb-1">
                {t("noJobsTitle")}
              </h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                {t("noJobsHint")}
              </p>
            </div>
          ) : (
            filteredJobs.map((job, index) => {
              const isOpen = job.status === "OPEN";
              const isDraft = job.status === "DRAFT";
              const isInProgress = job.status === "IN_PROGRESS";
              const isCompleted = job.status === "COMPLETED";
              const isClosed =
                job.status === "CLOSED" || job.status === "CANCELLED";

              const isBookmarked = bookmarkedJobIds.has(job.id);
              const relativeDate = formatRelativeDays(job.createdAt);

              const statusColorBadge = isOpen
                ? "bg-blue-50 text-[#0069D3] border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300"
                : isInProgress
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : isDraft
                    ? "bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400"
                    : isCompleted
                      ? "bg-purple-50 text-purple-700 border border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300"
                      : "bg-stone-100 text-stone-600 border border-stone-200/60 dark:bg-stone-800 dark:text-stone-300";

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
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  className="rounded-2xl border border-border/80 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-xs space-y-4 hover:shadow-md hover:border-[#0069D3]/30 transition-all"
                >
                  {/* Top Status & Code Header Row */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusColorBadge}`}
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                        <span>{statusText}</span>
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {t("jobCodeLabel", { code: job.id })}
                      </span>
                      <span className="text-muted-foreground/40">•</span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {t("postedDaysAgo", { days: relativeDate })}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => toggleBookmark(job.id)}
                        className="size-8 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
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
                            className="size-8 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            <Ellipsis className="size-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 rounded-2xl p-1.5 shadow-xl"
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
                              className="flex items-center gap-2 text-xs font-medium text-stone-600 cursor-pointer"
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
                              className="flex items-center gap-2 text-xs font-medium text-red-600 cursor-pointer"
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
                      className="text-lg sm:text-xl font-bold text-foreground hover:text-[#0069D3] transition-colors leading-snug line-clamp-2"
                    >
                      {job.title}
                    </Link>
                  </div>

                  {/* Meta Pills (Dữ liệu thực tế của job) */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Ngân sách */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F3F3F7] dark:bg-zinc-800 text-xs font-semibold text-foreground/80">
                      <CreditCard className="size-3.5 text-[#0069D3]" />
                      <span>{t("fixedPriceLabel", { price: formattedBudget })}</span>
                    </div>

                    {/* Hình thức tuyển dụng */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F3F3F7] dark:bg-zinc-800 text-xs font-semibold text-foreground/80">
                      {job.hiringType === "SINGLE" ? (
                        <>
                          <User className="size-3.5 text-muted-foreground" />
                          <span>{t("hiringSingle")}</span>
                        </>
                      ) : (
                        <>
                          <Users className="size-3.5 text-muted-foreground" />
                          <span>
                            {t("hiringMultiple", {
                              count: job.positionsRequired || 1,
                            })}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Hạn chót nếu có */}
                    {job.deadline && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F3F3F7] dark:bg-zinc-800 text-xs font-semibold text-foreground/80">
                        <Clock className="size-3.5 text-muted-foreground" />
                        <span>
                          {t("deadlineLabel", {
                            date: format.dateTime(new Date(job.deadline), {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }),
                          })}
                        </span>
                      </div>
                    )}

                    {/* Hạn nhận hồ sơ nếu có */}
                    {job.expiryDate && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F3F3F7] dark:bg-zinc-800 text-xs font-semibold text-foreground/80">
                        <Calendar className="size-3.5 text-muted-foreground" />
                        <span>
                          {t("expiryLabel", {
                            date: format.dateTime(new Date(job.expiryDate), {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            }),
                          })}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Description Snippet (Chỉ hiển thị khi có mô tả thật) */}
                  {job.description ? (
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {job.description.replace(/<[^>]+>/g, "")}
                    </p>
                  ) : null}

                  {/* Skills Tag Pills (Chỉ hiển thị các kỹ năng thực tế) */}
                  {job.skills && job.skills.length > 0 ? (
                    <div className="flex items-center gap-1.5 flex-wrap pt-1">
                      {job.skills.map((s, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 text-xs rounded-lg bg-[#F3F3F7] dark:bg-zinc-800 text-muted-foreground font-medium"
                        >
                          {s.skill.name}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  {/* Bottom Action Buttons: Chỉ giữ lại Xem chi tiết / Xem proposal */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
                    <Button
                      variant={proposalsCount > 0 ? "outline" : "default"}
                      size="sm"
                      asChild
                      className={
                        proposalsCount > 0
                          ? "rounded-xl border-border/80 px-4 h-9 text-xs font-semibold cursor-pointer"
                          : "rounded-xl bg-[#0069D3] hover:bg-[#005bb8] text-white px-5 h-9 text-xs font-semibold shadow-xs cursor-pointer"
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
                        className="rounded-xl bg-[#0069D3] hover:bg-[#005bb8] text-white px-5 h-9 text-xs font-semibold shadow-xs cursor-pointer"
                      >
                        <span>{t("publish")}</span>
                      </Button>
                    )}

                    {proposalsCount > 0 && (
                      <Button
                        size="sm"
                        asChild
                        className="rounded-xl bg-[#0069D3] hover:bg-[#005bb8] text-white px-5 h-9 text-xs font-semibold shadow-xs cursor-pointer"
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
                </motion.div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {paginationState.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
            <p className="font-mono text-xs text-muted-foreground">
              {tCommon("pageOf", {
                page: paginationState.page,
                totalPages: paginationState.totalPages,
              })}
            </p>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="size-8 rounded-xl cursor-pointer"
                disabled={paginationState.page <= 1}
                onClick={() => void handlePageChange(paginationState.page - 1)}
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8 rounded-xl cursor-pointer"
                disabled={paginationState.page >= paginationState.totalPages}
                onClick={() => void handlePageChange(paginationState.page + 1)}
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
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
