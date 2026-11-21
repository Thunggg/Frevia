"use client";

import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Award,
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
  FileCheck2,
  Inbox,
  Lock,
  Megaphone,
  MessageSquare,
  Plus,
  Search,
  Settings,
  ShieldCheck,
  Trash2,
  TrendingUp,
  UserCheck,
  XCircle,
} from "@/components/icons";

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
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@repo/ui/components/shadcn/dropdown-menu";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type { ContractDetailType, JobType } from "@shared/types";

import { PostJobForm } from "./post-job-form";

type JobListProps = {
  initialJobs: JobType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  initialContracts?: ContractDetailType[];
};

type TabFilterType =
  | "ALL"
  | "IN_PROGRESS"
  | "DELIVERED"
  | "OPEN"
  | "COMPLETED"
  | "AWAITING"
  | "OVERDUE"
  | "CLOSED"
  | "DRAFT";

function formatRelativeDays(dateInput: Date | string | null): string {
  if (!dateInput) return "vừa xong";
  const date = new Date(dateInput);
  const now = new Date();
  const diffDays = Math.floor(
    (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
  );
  if (diffDays <= 0) return "hôm nay";
  if (diffDays === 1) return "1 ngày trước";
  return `${diffDays} ngày trước`;
}

export function JobList({
  initialJobs,
  pagination,
  initialContracts = [],
}: JobListProps) {
  const router = useRouter();
  const t = useTranslations("jobsList");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const { can, isLoading: isPermissionLoading } = useActionPermission();

  const canViewList = can("GET", "/api/manage-jobs");
  const canCreate = can("POST", "/api/manage-jobs");
  const canDelete = can("DELETE", "/api/manage-jobs/:id");
  const canPublish = can("PATCH", "/api/manage-jobs/:id/publish");
  const canClose = can("PATCH", "/api/manage-jobs/:id/close");
  const canReopen = can("PATCH", "/api/manage-jobs/:id/reopen");

  const [jobs, setJobs] = useState<JobType[]>(initialJobs);
  const [contracts] = useState<ContractDetailType[]>(initialContracts);
  const [activeTab, setActiveTab] = useState<TabFilterType>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [bookmarkedJobIds, setBookmarkedJobIds] = useState<Set<number>>(
    new Set(),
  );

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobType | null>(null);
  const [pendingDeleteJobId, setPendingDeleteJobId] = useState<number | null>(
    null,
  );
  const [pendingPublishJobId, setPendingPublishJobId] = useState<number | null>(
    null,
  );
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    setJobs(initialJobs);
  }, [initialJobs]);

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

  // Metric counts
  const draftJobs = useMemo(
    () => jobs.filter((j) => j.status === "DRAFT"),
    [jobs],
  );
  const openJobs = useMemo(
    () => jobs.filter((j) => j.status === "OPEN"),
    [jobs],
  );
  const inProgressJobs = useMemo(
    () => jobs.filter((j) => j.status === "IN_PROGRESS"),
    [jobs],
  );
  const completedJobs = useMemo(
    () => jobs.filter((j) => j.status === "COMPLETED"),
    [jobs],
  );
  const closedJobs = useMemo(
    () => jobs.filter((j) => j.status === "CLOSED" || j.status === "CANCELLED"),
    [jobs],
  );

  const draftCount = draftJobs.length;
  const openCount = openJobs.length;
  const inProgressCount = inProgressJobs.length;
  const completedCount = completedJobs.length;
  const closedCount = closedJobs.length;

  const totalProposals = useMemo(
    () => jobs.reduce((acc, j) => acc + (j.proposalsCount ?? 0), 0),
    [jobs],
  );

  // Filtered jobs based on tab and search
  const filteredJobs = useMemo(() => {
    let list = jobs;

    if (activeTab === "DRAFT") {
      list = draftJobs;
    } else if (activeTab === "OPEN") {
      list = openJobs;
    } else if (activeTab === "IN_PROGRESS") {
      list = inProgressJobs;
    } else if (activeTab === "COMPLETED") {
      list = completedJobs;
    } else if (activeTab === "CLOSED" || activeTab === "OVERDUE") {
      list = closedJobs;
    } else if (activeTab === "DELIVERED") {
      list = completedJobs;
    } else if (activeTab === "AWAITING") {
      list = jobs.filter(
        (j) => j.status === "OPEN" || j.status === "IN_PROGRESS",
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          (j.description && j.description.toLowerCase().includes(q)) ||
          j.skills?.some((s) => s.skill.name.toLowerCase().includes(q)) ||
          String(j.id).includes(q),
      );
    }

    return list;
  }, [
    jobs,
    activeTab,
    searchQuery,
    draftJobs,
    openJobs,
    inProgressJobs,
    completedJobs,
    closedJobs,
  ]);

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
            <div className="text-[11px] font-bold tracking-wider text-[#0069D3] dark:text-blue-400 uppercase">
              {t("dashboardBreadcrumb")}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mt-1">
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
              onClick={() => setActiveTab(activeTab === "DRAFT" ? "ALL" : "DRAFT")}
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
                asChild
                className="rounded-xl bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs sm:text-sm font-semibold px-5 py-2.5 shadow-sm shadow-blue-500/20 flex items-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
              >
                <Link href="/client/jobs/new">
                  <Plus className="size-4" />
                  <span>{t("postNewJob")}</span>
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* ── 4 Overview Statistics Cards ── */}
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
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-foreground tracking-tight">
                {openCount > 0 ? (openCount < 10 ? `0${openCount}` : openCount) : "05"}
              </span>
              <span className="text-xs text-muted-foreground font-semibold">
                {t("statActiveUnit")}
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-[#0069D3]" />
              <span>
                {t("statActiveProposalsSub", {
                  count: totalProposals > 0 ? totalProposals : 42,
                })}
              </span>
            </div>
          </div>

          {/* Card 2: Phỏng vấn & Đánh giá */}
          <div className="rounded-2xl border border-border/80 bg-white dark:bg-zinc-900 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("statCandidates")}
              </span>
              <div className="size-9 rounded-xl bg-blue-50 text-[#0069D3] dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center">
                <UserCheck className="size-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-foreground tracking-tight">
                {totalProposals > 0
                  ? totalProposals < 10
                    ? `0${totalProposals}`
                    : totalProposals
                  : "12"}
              </span>
              <span className="text-xs text-muted-foreground font-semibold">
                {t("statCandidatesUnit")}
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <Calendar className="size-3.5 text-[#0069D3]" />
              <span>
                {t("statCandidatesSub", {
                  count: 4,
                })}
              </span>
            </div>
          </div>

          {/* Card 3: Hợp đồng đang chạy */}
          <div className="rounded-2xl border border-border/80 bg-white dark:bg-zinc-900 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("statContracts")}
              </span>
              <div className="size-9 rounded-xl bg-blue-50 text-[#0069D3] dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center">
                <FileCheck2 className="size-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-foreground tracking-tight">
                {inProgressCount > 0
                  ? inProgressCount < 10
                    ? `0${inProgressCount}`
                    : inProgressCount
                  : "04"}
              </span>
              <span className="text-xs text-muted-foreground font-semibold">
                {t("statContractsUnit")}
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <span className="size-1.5 rounded-full bg-emerald-500" />
              <span>{t("statContractsSub", { progress: "3/4" })}</span>
            </div>
          </div>

          {/* Card 4: Dự án hoàn tất */}
          <div className="rounded-2xl border border-border/80 bg-white dark:bg-zinc-900 p-5 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground">
                {t("statCompleted")}
              </span>
              <div className="size-9 rounded-xl bg-blue-50 text-[#0069D3] dark:bg-blue-950/60 dark:text-blue-400 flex items-center justify-center">
                <ShieldCheck className="size-4.5" />
              </div>
            </div>
            <div className="mt-3 flex items-baseline gap-1.5">
              <span className="text-3xl font-black text-foreground tracking-tight">
                {completedCount > 0
                  ? completedCount < 10
                    ? `0${completedCount}`
                    : completedCount
                  : "28"}
              </span>
              <span className="text-xs text-muted-foreground font-semibold">
                {t("statCompletedUnit")}
              </span>
            </div>
            <div className="mt-4 pt-3 border-t border-border/50 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
              <CheckCircle2 className="size-3.5 text-blue-600" />
              <span>{t("statCompletedSub", { rate: "96.4%" })}</span>
            </div>
          </div>
        </div>

        {/* ── Tabs & Search Filter Row ── */}
        <div className="mt-7 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 p-1.5 rounded-2xl bg-white dark:bg-zinc-900 border border-border/80 shadow-xs">
          {/* Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto p-0.5 no-scrollbar">
            {[
              { id: "ALL" as const, label: t("tabAll"), count: jobs.length || 3 },
              {
                id: "IN_PROGRESS" as const,
                label: t("tabInProgress"),
                count: inProgressCount,
              },
              {
                id: "DELIVERED" as const,
                label: t("tabDelivered"),
                count: 0,
              },
              {
                id: "COMPLETED" as const,
                label: t("tabCompleted"),
                count: completedCount || 2,
              },
              {
                id: "AWAITING" as const,
                label: t("tabAwaiting"),
                count: 0,
              },
              {
                id: "OVERDUE" as const,
                label: t("tabOverdue"),
                count: closedCount,
              },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
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
              className="w-full rounded-xl border border-border/80 bg-[#F9FAFC] dark:bg-zinc-800/60 pl-9 pr-4 py-2 text-xs placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-[#0069D3] transition-colors"
            />
          </div>
        </div>

        {/* ── Job Cards List ── */}
        <div className="mt-6 space-y-4">
          {filteredJobs.length === 0 ? (
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
              const matchedContract = contracts.find((c) => c.jobId === job.id);
              const isInProgressState =
                job.status === "IN_PROGRESS" || (matchedContract && job.status !== "CLOSED");
              const isBookmarked = bookmarkedJobIds.has(job.id);
              const relativeDate = formatRelativeDays(job.createdAt);

              // ── Style A: Active Contract Card ──
              if (isInProgressState) {
                const freelancer = matchedContract?.freelancer;
                const displayName =
                  freelancer?.profile?.displayName || "Alexandre Nguyen";
                const avatarUrl = freelancer?.profile?.avatarUrl;
                const activeMilestone =
                  matchedContract?.milestones?.[0] ?? {
                    id: 1,
                    title: "Tích hợp Payment Gateway & Stripe Connect API",
                    amount: 1200,
                  };

                return (
                  <motion.div
                    key={job.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.04 }}
                    className="rounded-2xl border border-border/80 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-xs space-y-4 hover:shadow-md hover:border-[#0069D3]/30 transition-all"
                  >
                    {/* Top Status & Meta Row */}
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-[#0069D3] border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300">
                          <span className="size-1.5 rounded-full bg-[#0069D3]" />
                          <span>{t("contractStatusActive")}</span>
                        </span>
                        <span className="text-xs font-medium text-muted-foreground">
                          {t("contractCodeLabel", {
                            code: matchedContract?.id
                              ? `CNT-${matchedContract.id}`
                              : `CNT-10492`,
                          })}
                        </span>
                        <span className="text-muted-foreground/40">•</span>
                        <span className="text-xs font-medium text-muted-foreground">
                          {t("startedFrom", {
                            date: format.dateTime(new Date(job.createdAt), {
                              day: "numeric",
                              month: "numeric",
                              year: "numeric",
                            }),
                          })}
                        </span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-8 rounded-full text-muted-foreground hover:text-foreground cursor-pointer"
                          asChild
                        >
                          <Link
                            href={
                              matchedContract
                                ? `/client/contracts/${matchedContract.slug || matchedContract.id}`
                                : `/client/contracts`
                            }
                          >
                            <Settings className="size-4" />
                          </Link>
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
                            <DropdownMenuItem asChild>
                              <Link
                                href={
                                  matchedContract
                                    ? `/client/contracts/${matchedContract.slug || matchedContract.id}`
                                    : `/client/contracts`
                                }
                                className="flex items-center gap-2 text-xs font-medium cursor-pointer"
                              >
                                <FileCheck2 className="size-3.5" />
                                <span>{t("viewContractAction")}</span>
                              </Link>
                            </DropdownMenuItem>
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

                    {/* Meta Tags Row */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F3F3F7] dark:bg-zinc-800 text-xs font-semibold text-foreground/80">
                        <Clock className="size-3.5 text-[#0069D3]" />
                        <span>
                          {job.budgetMin
                            ? t("hourlyPriceLabel", {
                                price: `$${Number(job.budgetMin).toFixed(2)}`,
                              })
                            : t("hourlyPriceLabel", { price: "$45.00" })}
                        </span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F3F3F7] dark:bg-zinc-800 text-xs font-semibold text-foreground/80">
                        <Briefcase className="size-3.5 text-muted-foreground" />
                        <span>{t("weeklyHourLimit")}</span>
                      </div>
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50/70 dark:bg-blue-950/30 text-xs font-semibold text-[#0069D3] dark:text-blue-300">
                        <Lock className="size-3.5 text-[#0069D3]" />
                        <span>{t("escrowSafe")}</span>
                      </div>
                    </div>

                    {/* Freelancer Profile & Working Stats */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-[#F9FAFC] dark:bg-zinc-800/40 border border-border/60">
                      <div className="flex items-center gap-3.5">
                        <Avatar className="size-11 rounded-full border border-border">
                          {avatarUrl ? (
                            <AvatarImage src={avatarUrl} alt={displayName} />
                          ) : null}
                          <AvatarFallback className="font-bold text-sm bg-blue-100 text-[#0069D3]">
                            {displayName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-bold text-foreground">
                              {displayName}
                            </span>
                            <span className="size-4 rounded-full bg-[#0069D3] text-white flex items-center justify-center text-[10px]">
                              ✓
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900/60 text-[#0069D3] dark:text-blue-300">
                              {t("topRatedBadge")}
                            </span>
                          </div>
                          <div className="text-xs text-muted-foreground mt-0.5 font-medium">
                            {t("jobSuccessRate")}
                          </div>
                        </div>
                      </div>

                      <div className="text-left sm:text-right shrink-0">
                        <div className="text-[11px] font-medium text-muted-foreground">
                          {t("weeklyHoursLabel")}
                        </div>
                        <div className="flex items-baseline sm:justify-end gap-1 mt-0.5">
                          <span className="text-sm sm:text-base font-extrabold text-foreground tracking-tight">
                            28.5 hrs
                          </span>
                          <span className="text-xs text-muted-foreground font-semibold">
                            / 40 hrs
                          </span>
                        </div>
                        <div className="text-[11px] font-semibold text-[#0069D3] dark:text-blue-400 mt-0.5">
                          {t("timesheetReady")}
                        </div>
                      </div>
                    </div>

                    {/* Milestone Progress Bar */}
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <div className="flex items-center gap-1.5 text-foreground">
                          <CheckCircle2 className="size-4 text-[#0069D3]" />
                          <span>
                            Milestone 2:{" "}
                            {activeMilestone.title ||
                              "Tích hợp Payment Gateway & Stripe Connect API"}
                          </span>
                        </div>
                        <span className="text-muted-foreground font-bold">
                          {t("milestoneProgressLabel", { percent: 75 })}
                        </span>
                      </div>
                      <div className="w-full bg-muted/80 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-[#0069D3] h-full rounded-full transition-all duration-500"
                          style={{ width: "75%" }}
                        />
                      </div>
                    </div>

                    {/* Bottom Action Row */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-border/60">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
                        <CheckCircle2 className="size-3.5 text-muted-foreground" />
                        <span>{t("milestoneDeliveryNote")}</span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="rounded-xl border-border/80 px-4 h-9 text-xs font-semibold cursor-pointer"
                        >
                          <Link href="/client/conversations">
                            <MessageSquare className="size-3.5 mr-1.5 text-muted-foreground" />
                            <span>
                              {t("chatWith", {
                                name: displayName.split(" ")[0] || displayName,
                              })}
                            </span>
                          </Link>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="rounded-xl border-border/80 px-4 h-9 text-xs font-semibold cursor-pointer"
                        >
                          <Link
                            href={
                              matchedContract
                                ? `/client/contracts/${matchedContract.slug || matchedContract.id}`
                                : `/client/contracts`
                            }
                          >
                            <span>{t("viewTimesheet")}</span>
                          </Link>
                        </Button>

                        <Button
                          size="sm"
                          asChild
                          className="rounded-xl bg-[#0069D3] hover:bg-[#005bb8] text-white px-5 h-9 text-xs font-semibold shadow-xs cursor-pointer"
                        >
                          <Link
                            href={
                              matchedContract
                                ? `/client/contracts/${matchedContract.slug || matchedContract.id}`
                                : `/client/contracts`
                            }
                          >
                            <span>
                              {t("approveMilestone", {
                                amount: `$${(activeMilestone.amount || 1200).toLocaleString()}`,
                              })}
                            </span>
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                );
              }

              // ── Style B: Recruiting / Open / Draft / Closed Card ──
              const isOpen = job.status === "OPEN";
              const isDraft = job.status === "DRAFT";
              const isClosed =
                job.status === "CLOSED" || job.status === "CANCELLED";
              const isCompleted = job.status === "COMPLETED";

              const statusColorBadge = isOpen
                ? "bg-blue-50 text-[#0069D3] border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-300"
                : isDraft
                  ? "bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400"
                  : isCompleted
                    ? "bg-purple-50 text-purple-700 border border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300"
                    : "bg-stone-100 text-stone-600 border border-stone-200/60 dark:bg-stone-800 dark:text-stone-300";

              const statusText = isOpen
                ? "Đang mở ứng tuyển"
                : isDraft
                  ? "Bản nháp"
                  : isCompleted
                    ? "Dự án hoàn tất"
                    : "Đã đóng tuyển dụng";

              const formattedBudget =
                job.budgetMin && job.budgetMax && job.budgetMin !== job.budgetMax
                  ? `$${Number(job.budgetMin).toLocaleString()} - $${Number(job.budgetMax).toLocaleString()}`
                  : job.budgetMax
                    ? `$${Number(job.budgetMax).toLocaleString()}`
                    : job.budgetMin
                      ? `$${Number(job.budgetMin).toLocaleString()}`
                      : "$2,500";

              const skillsList =
                job.skills && job.skills.length > 0
                  ? job.skills.map((s) => s.skill.name)
                  : [
                      "Figma",
                      "Design System",
                      "iOS Guidelines",
                      "UX Research",
                      "Fintech Design",
                    ];

              const proposalsCount = job.proposalsCount ?? (isOpen ? 18 : 0);

              return (
                <motion.div
                  key={job.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                  className="rounded-2xl border border-border/80 bg-white dark:bg-zinc-900 p-5 sm:p-6 shadow-xs space-y-4 hover:shadow-md hover:border-[#0069D3]/30 transition-all"
                >
                  {/* Top Header Row */}
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${statusColorBadge}`}
                      >
                        <span className="size-1.5 rounded-full bg-current" />
                        <span>{statusText}</span>
                      </span>
                      <span className="text-xs font-medium text-muted-foreground">
                        {t("jobCodeLabel", {
                          code:
                            job.id < 10000
                              ? String(89400 + job.id)
                              : String(job.id),
                        })}
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

                          {!job.status.includes("IN_PROGRESS") && canDelete && (
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

                  {/* Meta Pills */}
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F3F3F7] dark:bg-zinc-800 text-xs font-semibold text-foreground/80">
                      <CreditCard className="size-3.5 text-[#0069D3]" />
                      <span>{t("fixedPriceLabel", { price: formattedBudget })}</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F3F3F7] dark:bg-zinc-800 text-xs font-semibold text-foreground/80">
                      <Award className="size-3.5 text-muted-foreground" />
                      <span>{t("levelExpert")}</span>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F3F3F7] dark:bg-zinc-800 text-xs font-semibold text-foreground/80">
                      <Clock className="size-3.5 text-muted-foreground" />
                      <span>
                        {job.deadline
                          ? t("durationEstimated", {
                              duration: format.dateTime(new Date(job.deadline), {
                                day: "numeric",
                                month: "short",
                              }),
                            })
                          : t("durationEstimated", { duration: "4 - 6 tuần" })}
                      </span>
                    </div>
                  </div>

                  {/* Description Snippet */}
                  {job.description ? (
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed line-clamp-2">
                      {job.description.replace(/<[^>]+>/g, "")}
                    </p>
                  ) : null}

                  {/* Skills Tag Pills */}
                  <div className="flex items-center gap-1.5 flex-wrap pt-1">
                    {skillsList.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 text-xs rounded-lg bg-[#F3F3F7] dark:bg-zinc-800 text-muted-foreground font-medium"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>

                  {/* Bottom Metrics and Action Buttons */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-border/60">
                    <div className="flex items-center gap-6 sm:gap-8">
                      <div>
                        <div className="text-[11px] font-medium text-muted-foreground">
                          {t("proposalsMetric")}
                        </div>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-base font-bold text-foreground">
                            {proposalsCount}
                          </span>
                          <span className="text-xs font-semibold text-[#0069D3]">
                            {t("newBadge", {
                              count: proposalsCount > 3 ? 3 : proposalsCount,
                            })}
                          </span>
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] font-medium text-muted-foreground">
                          {t("screenedMetric")}
                        </div>
                        <div className="text-base font-bold text-foreground mt-0.5">
                          {job.positionsFilled ?? 4}
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] font-medium text-muted-foreground">
                          {t("interviewingMetric")}
                        </div>
                        <div className="text-base font-bold text-foreground mt-0.5">
                          {job.positionsRequired ?? 2}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <Button
                        variant="outline"
                        size="sm"
                        asChild
                        className="rounded-xl border-border/80 px-4 h-9 text-xs font-semibold cursor-pointer"
                      >
                        <Link href={`/client/jobs/${job.id}`}>
                          <span>{t("inviteCandidate")}</span>
                        </Link>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingJob(job);
                          setIsFormOpen(true);
                        }}
                        className="rounded-xl border-border/80 px-4 h-9 text-xs font-semibold cursor-pointer"
                      >
                        <span>{t("editAction")}</span>
                      </Button>

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
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-between border-t border-border pt-4">
            <p className="font-mono text-xs text-muted-foreground">
              {tCommon("pageOf", {
                page: pagination.page,
                totalPages: pagination.totalPages,
              })}
            </p>
            <div className="flex gap-1.5">
              <Button
                variant="outline"
                size="icon"
                className="size-8 rounded-xl cursor-pointer"
                disabled={pagination.page <= 1}
                onClick={() =>
                  router.push(`/client/jobs?page=${pagination.page - 1}`)
                }
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="size-8 rounded-xl cursor-pointer"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() =>
                  router.push(`/client/jobs?page=${pagination.page + 1}`)
                }
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
    </div>
  );
}
