"use client";

import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "motion/react";
import {
  Briefcase,
  Edit2,
  Ellipsis,
  FileText,
  Plus,
  Trash2,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  X,
} from "@/components/icons";

import jobApiRequest from "@/apiRequests/job";

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
import type { JobType } from "@shared/types";

import { PostJobForm } from "./post-job-form";

type JobListProps = {
  initialJobs: JobType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type StatusFilterType =
  | "ALL"
  | "DRAFT"
  | "OPEN"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CLOSED";

const JOB_STATUS_KEYS = [
  "DRAFT",
  "OPEN",
  "IN_PROGRESS",
  "COMPLETED",
  "CLOSED",
  "CANCELLED",
] as const;

const JOB_BUDGET_TYPE_KEYS = ["FIXED_PRICE"] as const;

interface StatusCapsuleBarProps {
  currentFilter: StatusFilterType;
  onSelectFilter: (filter: StatusFilterType) => void;
  counts: {
    all: number;
    draft: number;
    open: number;
    inProgress: number;
    completed: number;
    closed: number;
  };
}

function StatusCapsuleBar({
  currentFilter,
  onSelectFilter,
  counts,
}: StatusCapsuleBarProps) {
  const t = useTranslations("jobsList");
  const tStatus = useTranslations("jobStatus");
  const items = [
    {
      id: "ALL" as const,
      label: t("allJobs"),
      count: counts.all,
      icon: Briefcase,
      circleClass:
        "bg-[#F1F0F5] shadow-green-500/20 dark:bg-green-700 dark:shadow-green-700/20",
    },
    {
      id: "DRAFT" as const,
      label: tStatus("DRAFT"),
      count: counts.draft,
      icon: FileText,
      circleClass:
        "bg-[#F1F0F5] shadow-amber-500/20 dark:bg-amber-700 dark:shadow-amber-700/20",
    },
    {
      id: "OPEN" as const,
      label: tStatus("OPEN"),
      count: counts.open,
      icon: TrendingUp,
      circleClass:
        "bg-[#F1F0F5] shadow-green-500/20 dark:bg-green-700 dark:shadow-green-700/20",
    },
    {
      id: "IN_PROGRESS" as const,
      label: tStatus("IN_PROGRESS"),
      count: counts.inProgress,
      icon: Clock,
      circleClass:
        "bg-[#F1F0F5] shadow-blue-500/20 dark:bg-blue-700 dark:shadow-blue-700/20",
    },
    {
      id: "COMPLETED" as const,
      label: tStatus("COMPLETED"),
      count: counts.completed,
      icon: CheckCircle2,
      circleClass:
        "bg-[#F1F0F5] shadow-purple-500/20 dark:bg-purple-700 dark:shadow-purple-700/20",
    },
    {
      id: "CLOSED" as const,
      label: tStatus("CLOSED"),
      count: counts.closed,
      icon: XCircle,
      circleClass:
        "bg-[#F1F0F5] shadow-stone-500/20 dark:bg-stone-700 dark:shadow-stone-700/20",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="mt-6 w-full rounded-full bg-[#F3F3F7] p-0.5 border border-black/5 dark:bg-zinc-900/90 dark:border-white/10"
    >
      <div className="grid grid-cols-7 w-full items-center gap-1">
        {items.map((item) => {
          const isActive = currentFilter === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectFilter(item.id)}
              className={`group flex items-center gap-1.5 sm:gap-2 rounded-full py-1 sm:py-1.5 px-2.5 sm:px-3 transition-all duration-200 cursor-pointer overflow-hidden ${
                isActive
                  ? "col-span-2 bg-white text-foreground shadow-xs font-semibold justify-between dark:bg-zinc-800"
                  : "col-span-1 text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-zinc-800/60 font-medium justify-center"
              }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                <div
                  className={`flex size-5 sm:size-5.5 shrink-0 items-center justify-center rounded-full text-gray-600 transition-transform duration-200 group-hover:scale-105 ${item.circleClass}`}
                >
                  <Icon className="size-3 sm:size-3.5" />
                </div>

                <span
                  className={`text-xs truncate ${
                    isActive
                      ? "font-semibold text-foreground inline-block"
                      : "hidden lg:inline text-muted-foreground group-hover:text-foreground"
                  }`}
                >
                  {item.label}
                </span>
              </div>

              <span
                className={`flex h-4 min-w-4 sm:h-4.5 sm:min-w-4.5 shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-bold ${
                  isActive
                    ? "bg-muted text-foreground"
                    : "bg-black/5 text-muted-foreground dark:bg-white/10 group-hover:text-foreground"
                }`}
              >
                {item.count}
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}

function JobRowCard({
  job,
  index,
  onEdit,
  onDelete,
  onPublish,
  onClose,
  onReopen,
}: {
  job: JobType;
  index: number;
  onEdit: (job: JobType) => void;
  onDelete: (id: number) => void;
  onPublish: (id: number) => void;
  onClose: (id: number) => void;
  onReopen: (id: number) => void;
}) {
  const t = useTranslations("jobsList");
  const tStatus = useTranslations("jobStatus");
  const tBudgetType = useTranslations("jobBudgetType");
  const format = useFormatter();

  const formattedDate = job.createdAt
    ? format.dateTime(new Date(job.createdAt), {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : null;

  const currentStatusLabel = (JOB_STATUS_KEYS as readonly string[]).includes(
    job.status,
  )
    ? tStatus(job.status)
    : job.status;

  const budgetTypeLabel = (
    JOB_BUDGET_TYPE_KEYS as readonly string[]
  ).includes(job.budgetType)
    ? tBudgetType(job.budgetType)
    : job.budgetType;

  const money = (value: number) =>
    format.number(value, {
      style: "currency",
      currency: "USD",
      maximumFractionDigits: 0,
    });

  const isDraft = job.status === "DRAFT";
  const isOpen = job.status === "OPEN";
  const isClosed = job.status === "CLOSED";
  const isInProgress = job.status === "IN_PROGRESS";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: index * 0.03,
      }}
      className="group relative flex items-center justify-between gap-4 rounded-full border border-border bg-card p-4 sm:p-5 transition-colors hover:bg-accent/10"
    >
      {/* Tiêu đề in đậm, Số tiền & Ngày tạo */}
      <div className="flex-col min-w-0 flex-wrap items-center gap-x-3.5 gap-y-1">
        <Link
          href={`/client/jobs/${job.id}`}
          className="text-base text-foreground transition-colors hover:text-foreground/80 line-clamp-1"
        >
          {job.title}
        </Link>
        <span className="shrink-0 text-xs font-normal text-muted-foreground">
          {t("budgetLine", {
            min: money(job.budgetMin ?? 0),
            max: money(job.budgetMax ?? 0),
            type: budgetTypeLabel,
          })}
        </span>
        {formattedDate && (
          <span className="shrink-0 text-xs font-normal text-muted-foreground">
            {" "}• {formattedDate}
          </span>
        )}
      </div>

      {/* Cụm hành động nằm ngang: Status badge, Quick action, icon 3 chấm */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Status Badge */}
        <div
          className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold select-none ${
            isOpen
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/40"
              : isDraft
                ? "bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/40"
                : isInProgress
                  ? "bg-blue-50 text-blue-700 border border-blue-200/60 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/40"
                  : job.status === "COMPLETED"
                    ? "bg-purple-50 text-purple-700 border border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/40"
                    : "bg-stone-100 text-stone-600 border border-stone-200/60 dark:bg-stone-800 dark:text-stone-300 dark:border-stone-700"
          }`}
        >
          <span className="size-1.5 rounded-full bg-current" />
          <span>{currentStatusLabel}</span>
        </div>

        {/* Quick action button for primary transitions */}
        {isDraft && (
          <button
            type="button"
            onClick={() => onPublish(job.id)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 text-xs font-semibold transition-colors cursor-pointer shadow-xs"
          >
            <TrendingUp className="size-3.5" />
            <span>{t("publish")}</span>
          </button>
        )}

        {isClosed && (
          <button
            type="button"
            onClick={() => onReopen(job.id)}
            className="inline-flex h-9 items-center gap-1.5 rounded-full bg-[#EAE9F0] hover:bg-[#D0E1F8] text-[#0069D3] dark:bg-zinc-800 dark:text-blue-300 px-3.5 text-xs font-semibold transition-colors cursor-pointer"
          >
            <CheckCircle2 className="size-3.5" />
            <span>{t("reopen")}</span>
          </button>
        )}

        {/* 3-dot Action Menu (Publish, Close, Reopen, Edit & Delete) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-full bg-[#F3F3F7] dark:bg-zinc-800 hover:bg-[#EAE9F0] dark:hover:bg-zinc-700 text-muted-foreground hover:text-foreground cursor-pointer transition-colors outline-none"
              title={t("moreOptions")}
            >
              <Ellipsis className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={6}
            className="w-52 rounded-[24px] border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 p-2 shadow-2xl shadow-black/10 flex flex-col gap-1.5"
          >
            {/* UC-11.03 Publish Job */}
            {isDraft && (
              <DropdownMenuItem
                onClick={() => onPublish(job.id)}
                className="group flex items-center justify-between rounded-full px-3 py-2 bg-[#F3F3F7] hover:bg-emerald-50 focus:bg-emerald-50 dark:bg-zinc-800/60 dark:hover:bg-emerald-950/40 dark:focus:bg-emerald-950/40 cursor-pointer transition-all duration-200 outline-none text-emerald-700 dark:text-emerald-400"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-400 shadow-xs transition-transform group-hover:scale-105">
                    <TrendingUp className="size-3.5" />
                  </div>
                  <span className="text-xs font-medium">{t("publish")}</span>
                </div>
                <ChevronRight className="size-3.5 text-emerald-400/50 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </DropdownMenuItem>
            )}

            {/* UC-11.06 Close Job */}
            {(isOpen || isInProgress) && (
              <DropdownMenuItem
                onClick={() => onClose(job.id)}
                className="group flex items-center justify-between rounded-full px-3 py-2 bg-[#F3F3F7] hover:bg-stone-100 focus:bg-stone-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800 cursor-pointer transition-all duration-200 outline-none text-stone-700 dark:text-stone-300"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 shadow-xs transition-transform group-hover:scale-105">
                    <XCircle className="size-3.5" />
                  </div>
                  <span className="text-xs font-medium">{t("close")}</span>
                </div>
                <ChevronRight className="size-3.5 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </DropdownMenuItem>
            )}

            {/* UC-11.07 Reopen Job */}
            {isClosed && (
              <DropdownMenuItem
                onClick={() => onReopen(job.id)}
                className="group flex items-center justify-between rounded-full px-3 py-2 bg-[#F3F3F7] hover:bg-[#EAE9F0] focus:bg-[#EAE9F0] dark:bg-zinc-800/60 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800 cursor-pointer transition-all duration-200 outline-none text-[#0069D3] dark:text-blue-300"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-[#0069D3] dark:text-blue-300 shadow-xs transition-transform group-hover:scale-105">
                    <CheckCircle2 className="size-3.5" />
                  </div>
                  <span className="text-xs font-medium">{t("reopen")}</span>
                </div>
                <ChevronRight className="size-3.5 text-blue-400/50 group-hover:text-[#0069D3] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </DropdownMenuItem>
            )}

            {/* UC-11.04 Update Job */}
            <DropdownMenuItem
              onClick={() => onEdit(job)}
              className="group flex items-center justify-between rounded-full px-3 py-2 bg-[#F3F3F7] hover:bg-[#EAE9F0] focus:bg-[#EAE9F0] dark:bg-zinc-800/60 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800 cursor-pointer transition-all duration-200 outline-none"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white dark:bg-zinc-700 text-foreground shadow-xs transition-transform group-hover:scale-105">
                  <Edit2 className="size-3.5" />
                </div>
                <span className="text-xs font-medium text-foreground">
                  {t("edit")}
                </span>
              </div>
              <ChevronRight className="size-3.5 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </DropdownMenuItem>

            {/* UC-11.05 Delete Job */}
            <DropdownMenuItem
              onClick={() => onDelete(job.id)}
              className="group flex items-center justify-between rounded-full px-3 py-2 bg-[#F3F3F7] hover:bg-red-50 focus:bg-red-50 dark:bg-zinc-800/60 dark:hover:bg-red-950/40 dark:focus:bg-red-950/40 cursor-pointer transition-all duration-200 outline-none text-red-600 dark:text-red-400"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 shadow-xs transition-transform group-hover:scale-105">
                  <Trash2 className="size-3.5" />
                </div>
                <span className="text-xs font-medium text-red-600 dark:text-red-400">
                  {t("delete")}
                </span>
              </div>
              <ChevronRight className="size-3.5 text-red-400/50 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </motion.div>
  );
}

export function JobList({
  initialJobs,
  pagination,
}: JobListProps) {
  const router = useRouter();
  const t = useTranslations("jobsList");
  const tStatus = useTranslations("jobStatus");
  const tSidebar = useTranslations("sidebar");
  const tCommon = useTranslations("common");

  const [jobs, setJobs] = useState<JobType[]>(initialJobs);
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("ALL");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobType | null>(null);
  const [pendingDeleteJobId, setPendingDeleteJobId] = useState<number | null>(
    null,
  );

  const draftCount = jobs.filter((j) => j.status === "DRAFT").length;
  const openCount = jobs.filter((j) => j.status === "OPEN").length;
  const inProgressCount = jobs.filter((j) => j.status === "IN_PROGRESS").length;
  const completedCount = jobs.filter((j) => j.status === "COMPLETED").length;
  const closedCount = jobs.filter(
    (j) => j.status === "CLOSED" || j.status === "CANCELLED",
  ).length;

  const filteredJobs = jobs.filter((job) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "CLOSED") {
      return job.status === "CLOSED" || job.status === "CANCELLED";
    }
    return job.status === statusFilter;
  });

  const filterLabel =
    statusFilter === "ALL"
      ? t("allJobs")
      : (JOB_STATUS_KEYS as readonly string[]).includes(statusFilter)
        ? tStatus(statusFilter)
        : statusFilter;

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

  const publishJob = async (id: number) => {
    try {
      const response = await jobApiRequest.publishJob(id);
      if (!response.success) throw new Error();
      setJobs((current) =>
        current.map((job) =>
          job.id === id ? { ...job, status: "OPEN" } : job,
        ),
      );
      toastSuccess({ message: t("published") });
    } catch {
      toastError({ message: t("publishFailed") });
    }
  };

  const closeJob = async (id: number) => {
    try {
      const response = await jobApiRequest.closeJob(id);
      if (!response.success) throw new Error();
      setJobs((current) =>
        current.map((job) =>
          job.id === id ? { ...job, status: "CLOSED" } : job,
        ),
      );
      toastSuccess({ message: t("closed") });
    } catch {
      toastError({ message: t("closeFailed") });
    }
  };

  const reopenJob = async (id: number) => {
    try {
      const response = await jobApiRequest.reopenJob(id);
      if (!response.success) throw new Error();
      setJobs((current) =>
        current.map((job) =>
          job.id === id ? { ...job, status: "OPEN" } : job,
        ),
      );
      toastSuccess({ message: t("reopened") });
    } catch {
      toastError({ message: t("reopenFailed") });
    }
  };

  const deleteJob = async () => {
    if (pendingDeleteJobId === null) return;
    const id = pendingDeleteJobId;
    setPendingDeleteJobId(null);
    try {
      await jobApiRequest.deleteJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
      toastSuccess({ message: t("deleted") });
    } catch {
      toastError({ message: t("deleteFailed") });
    }
  };

  return (
    <div className="min-h-full bg-background font-sans">
      {/* ── Page Header ── */}
      <section className="border-b border-border bg-background">
        <div className="px-6 pt-8 pb-6 lg:px-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <motion.h1
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl"
              >
                {tSidebar("navMyJobs")}
              </motion.h1>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.35, delay: 0.15 }}
            >
              <Button
                asChild
                className="gap-2 rounded-full px-4 py-5 bg-[#F1F0F5] text-sm font-semibold text-gray-700 dark:bg-green-700 dark:text-blue-100 hover:bg-blue-400 dark:hover:bg-green-600"
              >
                <Link href="/client/jobs/new">
                  <Plus className="size-4" />
                  {t("postJob")}
                </Link>
              </Button>
            </motion.div>
          </div>

          {/* Full-width Capsule Status Bar */}
          <StatusCapsuleBar
            currentFilter={statusFilter}
            onSelectFilter={setStatusFilter}
            counts={{
              all: jobs.length,
              draft: draftCount,
              open: openCount,
              inProgress: inProgressCount,
              completed: completedCount,
              closed: closedCount,
            }}
          />
        </div>
      </section>

      {/* ── Job list (Horizontal Cards) ── */}
      <div className="px-6 py-8 lg:px-8">
        {filteredJobs.length ? (
          <>
            <div className="space-y-3">
              {filteredJobs.map((job, i) => (
                <JobRowCard
                  key={job.id}
                  job={job}
                  index={i}
                  onEdit={(j) => {
                    setEditingJob(j);
                    setIsFormOpen(true);
                  }}
                  onDelete={setPendingDeleteJobId}
                  onPublish={publishJob}
                  onClose={closeJob}
                  onReopen={reopenJob}
                />
              ))}
            </div>

            {pagination.totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="mt-8 flex items-center justify-between border-t border-border pt-4"
              >
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
                    className="size-8 rounded-xl"
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
                    className="size-8 rounded-xl"
                    disabled={pagination.page >= pagination.totalPages}
                    onClick={() =>
                      router.push(`/client/jobs?page=${pagination.page + 1}`)
                    }
                  >
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </motion.div>
            )}
          </>
        ) : jobs.length ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card/40 px-6 py-16 text-center"
          >
            <div className="mb-3 flex size-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Briefcase className="size-5" />
            </div>
            <p className="text-sm font-semibold text-foreground">
              {t("noJobsForStatus", { status: filterLabel })}
            </p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
              {t("noJobsForStatusHint")}
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 rounded-xl text-xs cursor-pointer"
              onClick={() => setStatusFilter("ALL")}
            >
              {t("showAllJobs", { count: jobs.length })}
            </Button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex flex-col items-center justify-center rounded-2xl border border-border bg-card/40 px-6 py-20 text-center"
          >
            <div className="mb-4 flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
              <Briefcase className="size-6" />
            </div>
            <p className="text-base font-semibold text-foreground">
              {t("noJobsTitle")}
            </p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
              {t("noJobsHint")}
            </p>
            <Button
              asChild
              className="mt-6 gap-2 rounded-xl bg-foreground text-xs font-medium text-background hover:bg-foreground/90"
            >
              <Link href="/client/jobs/new">
                <Plus className="size-4" />
                {t("postJob")}
              </Link>
            </Button>
          </motion.div>
        )}
      </div>

      <PostJobForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSaved={saveJob}
        job={editingJob ?? undefined}
      />

      <AlertDialog
        open={pendingDeleteJobId !== null}
        onOpenChange={(open) => !open && setPendingDeleteJobId(null)}
      >
        <AlertDialogContent className="max-w-sm rounded-[26px] border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 p-5 shadow-2xl font-sans">
          <div className="flex flex-col gap-3">
            <div className="px-1">
              <AlertDialogTitle className="text-base font-bold text-foreground">
                {t("deleteTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-1 text-xs text-muted-foreground leading-normal">
                {t("deleteHint")}
              </AlertDialogDescription>
            </div>

            <div className="mt-1 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => void deleteJob()}
                className="group flex w-full items-center justify-between rounded-full px-3.5 py-2.5 bg-red-50 hover:bg-red-100 dark:bg-red-950/40 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 cursor-pointer transition-all duration-200 outline-none"
              >
                <div className="flex items-center gap-2.5">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400 shadow-xs transition-transform group-hover:scale-105">
                    <Trash2 className="size-3.5" />
                  </div>
                  <span className="text-xs font-semibold">
                    {t("deleteJob")}
                  </span>
                </div>
                <ChevronRight className="size-3.5 text-red-400 group-hover:text-red-600 group-hover:translate-x-0.5 transition-all" />
              </button>

              <AlertDialogCancel asChild>
                <button
                  type="button"
                  className="group flex w-full items-center justify-between rounded-full px-3.5 py-2.5 bg-[#F1F0F5] hover:bg-[#EAE9F0] dark:bg-zinc-800/80 dark:hover:bg-zinc-800 text-foreground cursor-pointer transition-all duration-200 outline-none border-0 m-0"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white dark:bg-zinc-700 text-muted-foreground shadow-xs transition-transform group-hover:scale-105">
                      <X className="size-3.5" />
                    </div>
                    <span className="text-xs font-medium">{t("cancel")}</span>
                  </div>
                  <ChevronRight className="size-3.5 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all" />
                </button>
              </AlertDialogCancel>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
