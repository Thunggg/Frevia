"use client";

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
  ChevronDown,
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
import type { JobStatusType, JobType } from "@shared/types";

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

type StatusFilterType = "ALL" | "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CLOSED";

interface StatusCapsuleBarProps {
  currentFilter: StatusFilterType;
  onSelectFilter: (filter: StatusFilterType) => void;
  counts: {
    all: number;
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
  const items = [
    {
      id: "ALL" as const,
      label: "All Jobs",
      count: counts.all,
      icon: Briefcase,
      circleClass:
        "bg-[#F1F0F5] shadow-green-500/20 dark:bg-green-700 dark:shadow-green-700/20",
    },
    {
      id: "OPEN" as const,
      label: "Open",
      count: counts.open,
      icon: TrendingUp,
      circleClass: "bg-[#F1F0F5] shadow-green-500/20 dark:bg-green-700 dark:shadow-green-700/20",
    },
    {
      id: "IN_PROGRESS" as const,
      label: "In Progress",
      count: counts.inProgress,
      icon: Clock,
      circleClass: "bg-[#F1F0F5] shadow-green-500/20 dark:bg-green-700 dark:shadow-green-700/20",
    },
    {
      id: "COMPLETED" as const,
      label: "Completed",
      count: counts.completed,
      icon: CheckCircle2,
      circleClass: "bg-[#F1F0F5] shadow-green-500/20 dark:bg-green-700 dark:shadow-green-700/20",
    },
    {
      id: "CLOSED" as const,
      label: "Closed",
      count: counts.closed,
      icon: XCircle,
      circleClass: "bg-[#F1F0F5] shadow-green-500/20 dark:bg-green-700 dark:shadow-green-700/20",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.1 }}
      className="mt-6 w-full rounded-full bg-[#F3F3F7] p-0.5 border border-black/5 dark:bg-zinc-900/90 dark:border-white/10"
    >
      <div className="grid grid-cols-6 w-full items-center gap-1">
        {items.map((item) => {
          const isActive = currentFilter === item.id;
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectFilter(item.id)}
              className={`group flex items-center gap-1.5 sm:gap-2 rounded-full py-1 sm:py-1.5 px-2.5 sm:px-3 transition-all duration-200 cursor-pointer overflow-hidden ${isActive
                ? "col-span-2 bg-white text-foreground shadow-xs font-semibold justify-between dark:bg-zinc-800"
                : "col-span-1 text-muted-foreground hover:text-foreground hover:bg-white/60 dark:hover:bg-zinc-800/60 font-medium justify-center"
                }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                {/* Circular badge icon */}
                <div
                  className={`flex size-5 sm:size-5.5 shrink-0 items-center justify-center rounded-full text-gray-600 transition-transform duration-200 group-hover:scale-105 ${item.circleClass}`}
                >
                  <Icon className="size-3 sm:size-3.5" />
                </div>

                {/* Label */}
                <span
                  className={`text-xs truncate ${isActive
                    ? "font-semibold text-foreground inline-block"
                    : "hidden lg:inline text-muted-foreground group-hover:text-foreground"
                    }`}
                >
                  {item.label}
                </span>
              </div>

              {/* Count badge */}
              <span
                className={`flex h-4 min-w-4 sm:h-4.5 sm:min-w-4.5 shrink-0 items-center justify-center rounded-full px-1 text-[10px] font-bold ${isActive
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

const STATUS_OPTIONS: {
  value: JobStatusType;
  label: string;
  icon: typeof TrendingUp;
  circleBg: string;
}[] = [
    {
      value: "OPEN",
      label: "Open",
      icon: TrendingUp,
      circleBg: "bg-green-100 text-green-600 dark:bg-green-950 dark:text-green-400",
    },
    {
      value: "IN_PROGRESS",
      label: "In Progress",
      icon: Clock,
      circleBg: "bg-blue-100 text-blue-600 dark:bg-blue-950 dark:text-blue-400",
    },
    {
      value: "COMPLETED",
      label: "Completed",
      icon: CheckCircle2,
      circleBg: "bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400",
    },
    {
      value: "DRAFT",
      label: "Draft",
      icon: FileText,
      circleBg: "bg-zinc-200 text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300",
    },
    {
      value: "CLOSED",
      label: "Closed",
      icon: XCircle,
      circleBg: "bg-stone-200 text-stone-600 dark:bg-stone-800 dark:text-stone-300",
    },
    {
      value: "CANCELLED",
      label: "Cancelled",
      icon: XCircle,
      circleBg: "bg-red-100 text-red-600 dark:bg-red-950 dark:text-red-400",
    },
  ];

function JobRowCard({
  job,
  index,
  onEdit,
  onDelete,
  onChangeStatus,
}: {
  job: JobType;
  index: number;
  onEdit: (job: JobType) => void;
  onDelete: (id: number) => void;
  onChangeStatus: (id: number, status: JobStatusType) => void;
}) {
  const formattedDate = job.createdAt
    ? new Intl.DateTimeFormat("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(job.createdAt))
    : null;

  const currentStatusObj = STATUS_OPTIONS.find((s) => s.value === job.status) ?? {
    value: job.status,
    label: job.status[0] + job.status.slice(1).toLowerCase().replace("_", " "),
    icon: TrendingUp,
    circleBg: "bg-zinc-200 text-zinc-600",
  };

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
      {/* Tiêu đề in đậm, Số tiền & Ngày tạo chữ không đậm - tất cả nằm ngang */}
      <div className="flex-col min-w-0  flex-wrap items-center gap-x-3.5 gap-y-1">
        <Link
          href={`/client/jobs/${job.id}`}
          className="text-base text-foreground transition-colors hover:text-foreground/80 line-clamp-1"
        >
          {job.title}
        </Link>
        <span className="shrink-0 text-xs font-normal text-muted-foreground">
          ${job.budgetMin ?? 0} – ${job.budgetMax ?? 0} ({job.budgetType})
        </span>
        {formattedDate && (
          <span className="shrink-0 text-xs font-normal text-muted-foreground">
            • {formattedDate}
          </span>
        )}
      </div>

      {/* Cụm hành động nằm ngang: Status và icon 3 chấm */}
      <div className="flex shrink-0 items-center gap-2">
        {/* Status Dropdown - giao diện dạng capsule y hệt như hình */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="group inline-flex h-10 items-center gap-1.5 rounded-full bg-[#D0E1F8] dark:bg-zinc-800/90 px-4 py-4 text-sm font-semibold text-[#0069D3] dark:text-green-300 hover:bg-[#EAE9F0] dark:hover:bg-zinc-700/80 transition-colors cursor-pointer outline-none"
            >
              <span>{currentStatusObj.label}</span>
              <ChevronDown className="size-3.5 opacity-60 group-hover:opacity-100 transition-opacity" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={6}
            className="w-56 rounded-[24px] border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 p-2 shadow-2xl shadow-black/10 flex flex-col gap-1.5"
          >
            {STATUS_OPTIONS.map((st) => (
              <DropdownMenuItem
                key={st.value}
                onClick={() => onChangeStatus(job.id, st.value)}
                className={`group flex items-center justify-between rounded-full px-3 py-2 cursor-pointer transition-all duration-200 outline-none ${job.status === st.value
                  ? "bg-[#EAE9F0] dark:bg-zinc-800 font-semibold ring-1 ring-black/5 dark:ring-white/10"
                  : "bg-[#F3F3F7] hover:bg-[#EAE9F0] focus:bg-[#EAE9F0] dark:bg-zinc-800/60 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800"
                  }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full ${st.circleBg} shadow-xs transition-transform group-hover:scale-105`}
                  >
                    <st.icon className="size-3.5" />
                  </div>
                  <span className="text-xs font-medium text-foreground truncate">
                    {st.label}
                  </span>
                </div>
                <ChevronRight className="size-3.5 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* 3-dot Action Menu (Edit & Delete) - giao diện capsule y hệt như hình */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex size-8 items-center justify-center rounded-full bg-[#F3F3F7] dark:bg-zinc-800 hover:bg-[#EAE9F0] dark:hover:bg-zinc-700 text-muted-foreground hover:text-foreground cursor-pointer transition-colors outline-none"
              title="More options"
            >
              <Ellipsis className="size-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={6}
            className="w-48 rounded-[24px] border border-black/5 dark:border-white/10 bg-white dark:bg-zinc-900 p-2 shadow-2xl shadow-black/10 flex flex-col gap-1.5"
          >
            {/* Nút Edit */}
            <DropdownMenuItem
              onClick={() => onEdit(job)}
              className="group flex items-center justify-between rounded-full px-3 py-2 bg-[#F3F3F7] hover:bg-[#EAE9F0] focus:bg-[#EAE9F0] dark:bg-zinc-800/60 dark:hover:bg-zinc-800 dark:focus:bg-zinc-800 cursor-pointer transition-all duration-200 outline-none"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-white dark:bg-zinc-700 text-foreground shadow-xs transition-transform group-hover:scale-105">
                  <Edit2 className="size-3.5" />
                </div>
                <span className="text-xs font-medium text-foreground">Edit</span>
              </div>
              <ChevronRight className="size-3.5 text-muted-foreground/50 group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
            </DropdownMenuItem>

            {/* Nút Delete */}
            <DropdownMenuItem
              onClick={() => onDelete(job.id)}
              className="group flex items-center justify-between rounded-full px-3 py-2 bg-[#F3F3F7] hover:bg-red-50 focus:bg-red-50 dark:bg-zinc-800/60 dark:hover:bg-red-950/40 dark:focus:bg-red-950/40 cursor-pointer transition-all duration-200 outline-none text-red-600 dark:text-red-400"
            >
              <div className="flex items-center gap-2.5">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/50 text-red-600 dark:text-red-400 shadow-xs transition-transform group-hover:scale-105">
                  <Trash2 className="size-3.5" />
                </div>
                <span className="text-xs font-medium text-red-600 dark:text-red-400">Delete</span>
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
  const [jobs, setJobs] = useState<JobType[]>(initialJobs);
  const [statusFilter, setStatusFilter] = useState<StatusFilterType>("ALL");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobType | null>(null);
  const [pendingDeleteJobId, setPendingDeleteJobId] = useState<number | null>(
    null,
  );

  const openCount = jobs.filter((j) => j.status === "OPEN").length;
  const inProgressCount = jobs.filter((j) => j.status === "IN_PROGRESS").length;
  const completedCount = jobs.filter((j) => j.status === "COMPLETED").length;
  const cancelledCount = jobs.filter(
    (j) => j.status === "CLOSED" || j.status === "CANCELLED",
  ).length;

  const filteredJobs = jobs.filter((job) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "CLOSED") {
      return job.status === "CLOSED" || job.status === "CANCELLED";
    }
    return job.status === statusFilter;
  });

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

  const changeStatus = async (id: number, status: JobStatusType) => {
    const prev = jobs;
    setJobs((current) =>
      current.map((job) => (job.id === id ? { ...job, status } : job)),
    );
    try {
      await jobApiRequest.changeJobStatus(id, { status });
      toastSuccess({ message: "Status updated" });
    } catch {
      setJobs(prev);
      toastError({ message: "Failed to update status" });
    }
  };

  const deleteJob = async () => {
    if (pendingDeleteJobId === null) return;
    const id = pendingDeleteJobId;
    setPendingDeleteJobId(null);
    try {
      await jobApiRequest.deleteJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
      toastSuccess({ message: "Job deleted successfully" });
    } catch {
      toastError({ message: "Failed to delete job" });
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
                My Jobs
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
                  Post a job
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
              open: openCount,
              inProgress: inProgressCount,
              completed: completedCount,
              closed: cancelledCount,
            }}
          />
        </div>
      </section>

      {/* ── Job list (Horizontal Cards like Proposals) ── */}
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
                  onChangeStatus={changeStatus}
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
                  Page {pagination.page} of {pagination.totalPages}
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
              No {statusFilter.toLowerCase().replace("_", " ")} jobs found
            </p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
              There are currently no postings matching this status.
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-4 rounded-xl text-xs cursor-pointer"
              onClick={() => setStatusFilter("ALL")}
            >
              Show all jobs ({jobs.length})
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
              No jobs posted yet
            </p>
            <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
              Post your first job to start receiving proposals from
              freelancers.
            </p>
            <Button
              asChild
              className="mt-6 gap-2 rounded-xl bg-foreground text-xs font-medium text-background hover:bg-foreground/90"
            >
              <Link href="/client/jobs/new">
                <Plus className="size-4" />
                Post a job
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
            {/* Header info */}
            <div className="px-1">
              <AlertDialogTitle className="text-base font-bold text-foreground">
                Delete job
              </AlertDialogTitle>
              <AlertDialogDescription className="mt-1 text-xs text-muted-foreground leading-normal">
                Are you sure you want to delete this job? This action cannot be undone.
              </AlertDialogDescription>
            </div>

            {/* Action options as sleek capsules */}
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
                  <span className="text-xs font-semibold">Delete job</span>
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
                    <span className="text-xs font-medium">Cancel</span>
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
