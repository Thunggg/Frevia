"use client";

import { useFormatter, useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Share2 } from "lucide-react";
import { ArrowLeft, ChevronRight } from "@/components/icons";

import jobApiRequest from "@/apiRequests/job";
import {
  extractProposalData,
  proposalApiRequest,
} from "@/apiRequests/proposal";
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
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type { JobType, ViewJobDetailResType } from "@shared/types";

import { PostJobForm } from "../../_components/post-job-form";
import { RecommendedFreelancersSection } from "@/app/(client)/_components/recommended-freelancers-section";

const JOB_STATUS_KEYS = [
  "DRAFT",
  "OPEN",
  "IN_PROGRESS",
  "COMPLETED",
  "CLOSED",
  "CANCELLED",
] as const;

const JOB_BUDGET_TYPE_KEYS = ["FIXED_PRICE"] as const;

const JOB_STATUS_TEXT_STYLES: Record<string, string> = {
  OPEN: "text-[#0069D3] dark:text-blue-400",
  IN_PROGRESS: "text-[#0069D3] dark:text-blue-400",
  DRAFT: "text-muted-foreground",
  COMPLETED: "text-foreground",
  CLOSED: "text-muted-foreground",
  CANCELLED: "text-destructive",
};

function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
}

function JobDescription({
  description,
  emptyText,
}: {
  description: string | null;
  emptyText: string;
}) {
  if (!description) {
    return (
      <p className="text-sm italic text-muted-foreground">{emptyText}</p>
    );
  }

  if (looksLikeHtml(description)) {
    return (
      <div
        className="job-description max-w-none text-sm sm:text-base leading-relaxed text-foreground/85 [&_a]:text-[#0069D3] [&_a]:underline [&_a]:underline-offset-2 [&_h1]:mb-3 [&_h1]:mt-5 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-foreground [&_h2]:mb-2 [&_h2]:mt-4 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mb-2 [&_h3]:mt-3 [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:my-1.5 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3.5 [&_p:last-child]:mb-0 [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5"
        dangerouslySetInnerHTML={{ __html: description }}
      />
    );
  }

  return (
    <p className="whitespace-pre-wrap text-sm sm:text-base leading-relaxed text-foreground/85">
      {description}
    </p>
  );
}

export function JobDetail({
  job: initialJob,
  canViewProposals,
}: {
  job: ViewJobDetailResType;
  canViewProposals: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("jobDetailClient");
  const tList = useTranslations("jobsList");
  const tStatus = useTranslations("jobStatus");
  const tBudgetType = useTranslations("jobBudgetType");
  const tHiringType = useTranslations("jobHiringType");
  const tCommon = useTranslations("common");
  const tSidebar = useTranslations("sidebar");
  const format = useFormatter();

  const [job, setJob] = useState<ViewJobDetailResType>(initialJob);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const hiringOverviewQuery = useQuery({
    queryKey: ["client-job-hiring-overview", job.id],
    enabled: canViewProposals,
    queryFn: async () => {
      const [allRes, submittedRes, hiredRes, rejectedRes] = await Promise.all([
        proposalApiRequest
          .getClientJobProposals(job.id, { page: 1, limit: 1 })
          .then(extractProposalData),
        proposalApiRequest
          .getClientJobProposals(job.id, {
            page: 1,
            limit: 1,
            status: "SUBMITTED",
          })
          .then(extractProposalData),
        proposalApiRequest
          .getClientJobProposals(job.id, {
            page: 1,
            limit: 1,
            status: "HIRED",
          })
          .then(extractProposalData),
        proposalApiRequest
          .getClientJobProposals(job.id, {
            page: 1,
            limit: 1,
            status: "REJECTED",
          })
          .then(extractProposalData),
      ]);

      return {
        total: allRes.totalItems,
        underReview: submittedRes.totalItems,
        hired: hiredRes.totalItems,
        rejected: rejectedRes.totalItems,
      };
    },
  });

  const proposalsCount =
    hiringOverviewQuery.data?.total ?? job.proposalsCount ?? 0;
  const underReviewCount = hiringOverviewQuery.data?.underReview ?? 0;
  const hiredCount = hiringOverviewQuery.data?.hired ?? job.positionsFilled;
  const rejectedCount = hiringOverviewQuery.data?.rejected ?? 0;

  const positionsRequired = Math.max(1, job.positionsRequired);
  const positionsFilled = job.positionsFilled;
  const positionsRemaining = Math.max(0, positionsRequired - positionsFilled);
  const hiringProgressPercent = Math.min(
    100,
    Math.round((positionsFilled / positionsRequired) * 100),
  );

  const [isPublishDialogOpen, setIsPublishDialogOpen] = useState(false);
  const [isActionLoading, setIsActionLoading] = useState(false);

  const { can } = useActionPermission();
  const canUpdate = can("PATCH", "/api/manage-jobs/:id");
  const canPublish = can("PATCH", "/api/manage-jobs/:id/publish");
  const canClose = can("PATCH", "/api/manage-jobs/:id/close");
  const canReopen = can("PATCH", "/api/manage-jobs/:id/reopen");

  const isOpen = job.status === "OPEN";
  const isDraft = job.status === "DRAFT";
  const isClosed = job.status === "CLOSED" || job.status === "CANCELLED";
  const isEditable =
    job.status !== "IN_PROGRESS" && job.status !== "COMPLETED";

  const formatBudget = (
    target: Pick<ViewJobDetailResType, "budgetMin" | "budgetMax">,
  ) => {
    const currency = {
      style: "currency" as const,
      currency: "USD",
      maximumFractionDigits: 0,
    };

    if (
      target.budgetMin !== null &&
      target.budgetMax !== null &&
      target.budgetMin !== target.budgetMax
    ) {
      return t("budgetRange", {
        min: format.number(target.budgetMin, currency),
        max: format.number(target.budgetMax, currency),
      });
    }
    if (target.budgetMax !== null) {
      return format.number(target.budgetMax, currency);
    }
    if (target.budgetMin !== null) {
      return format.number(target.budgetMin, currency);
    }
    return t("negotiable");
  };

  const formatDate = (value: string | Date | null) =>
    value
      ? format.dateTime(new Date(value), {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : tCommon("notSet");

  const formatRelativeDays = (dateInput: Date | string | null): string => {
    if (!dateInput) return tList("relativeJustNow");
    const date = new Date(dateInput);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diffDays <= 0) return tList("relativeToday");
    if (diffDays === 1) return tList("relativeOneDayAgo");
    return tList("relativeDaysAgo", { count: diffDays });
  };

  const formatExpiryText = (expiryDate: Date | string) => {
    const target = new Date(expiryDate);
    const now = new Date();
    const diffDays = Math.ceil(
      (target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    const formatted = formatDate(target);
    if (diffDays < 0) {
      return t("deadlineExpired", { date: formatted });
    }
    return t("daysRemaining", { days: Math.max(0, diffDays), date: formatted });
  };

  const statusLabel = (JOB_STATUS_KEYS as readonly string[]).includes(job.status)
    ? tStatus(job.status)
    : job.status;

  const statusTextClass =
    JOB_STATUS_TEXT_STYLES[job.status] ?? "text-muted-foreground";

  const budgetTypeLabel =
    job.budgetType &&
    (JOB_BUDGET_TYPE_KEYS as readonly string[]).includes(job.budgetType)
      ? tBudgetType(job.budgetType)
      : job.budgetType;

  const handleSaved = (saved: JobType) => {
    setJob((prev) => ({
      ...prev,
      ...saved,
      skills: saved.skills ?? prev.skills,
    }));
    setIsEditOpen(false);
    router.refresh();
  };

  const handleCloseJob = async () => {
    if (!canClose || isActionLoading) return;
    setIsActionLoading(true);
    try {
      const response = await jobApiRequest.closeJob(job.id);
      if (!response.success) throw new Error();
      setJob((prev) => ({ ...prev, status: "CLOSED" }));
      toastSuccess({ message: tList("closed") });
      router.refresh();
    } catch {
      toastError({ message: tList("closeFailed") });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleReopenJob = async () => {
    if (!canReopen || isActionLoading) return;
    setIsActionLoading(true);
    try {
      const response = await jobApiRequest.reopenJob(job.id);
      if (!response.success) throw new Error();
      setJob((prev) => ({ ...prev, status: "OPEN" }));
      toastSuccess({ message: tList("reopened") });
      router.refresh();
    } catch {
      toastError({ message: tList("reopenFailed") });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleConfirmPublish = async () => {
    if (!canPublish || isActionLoading) return;
    setIsActionLoading(true);
    try {
      const response = await jobApiRequest.publishJob(job.id);
      if (!response.success) throw new Error();
      setJob((prev) => ({ ...prev, status: "OPEN" }));
      toastSuccess({ message: tList("published") });
      setIsPublishDialogOpen(false);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof ApiFail
          ? (error.response?.error?.message ?? error.message)
          : tList("publishFailed");
      toastError({ message: message || tList("publishFailed") });
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toastSuccess({ message: t("linkCopied") });
    } catch {
      // Ignore clipboard failure
    }
  };

  return (
    <div className="min-h-full bg-background font-sans pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Back / Breadcrumb */}
        <div className="mb-4">
          <Link
            href="/client/jobs"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            <span>{tSidebar("navMyJobs")}</span>
            <span className="text-muted-foreground/40">/</span>
            <span className="text-foreground">
              {t("jobNumber", { id: job.id })}
            </span>
          </Link>
        </div>

        {/* ── Hiring Overview Card ── */}
        {canViewProposals && (
          <div className="mb-4 rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
              <h2 className="text-sm font-semibold text-foreground">
                {t("hiringOverviewTitle")}
              </h2>
              <Link
                href={`/client/jobs/${job.id}/proposals`}
                className="inline-flex items-center gap-1 text-xs font-medium text-[#0069D3] hover:underline"
              >
                <span>{t("viewAllProposals")}</span>
                <ChevronRight className="size-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">
                  {t("metricTotalProposals")}
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                  {hiringOverviewQuery.isLoading ? "—" : proposalsCount}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  {t("metricUnderReview")}
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                  {hiringOverviewQuery.isLoading ? "—" : underReviewCount}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  {t("metricHired")}
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                  {hiringOverviewQuery.isLoading ? "—" : hiredCount}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted-foreground">
                  {t("metricRejected")}
                </p>
                <p className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                  {hiringOverviewQuery.isLoading ? "—" : rejectedCount}
                </p>
              </div>
            </div>

            {/* Hiring Progress (Multiple positions only) */}
            {job.hiringType === "MULTIPLE" && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">
                      {t("hiringProgressTitle")}
                    </span>
                    <span className="text-muted-foreground">
                      {t("positionsFilled", {
                        filled: positionsFilled,
                        required: positionsRequired,
                      })}
                    </span>
                  </div>
                  <span className="text-muted-foreground">
                    {positionsRemaining > 0
                      ? t("hiringProgressRemaining", {
                          remaining: positionsRemaining,
                        })
                      : t("hiringProgressCompleted")}
                  </span>
                </div>
                <div className="mt-2 h-1.5 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#0069D3] transition-all duration-300"
                    style={{ width: `${hiringProgressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Main Job Detail Card ── */}
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Header Block */}
          <div className="p-5 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
                <span
                  className={`inline-flex items-center gap-1.5 font-semibold ${statusTextClass}`}
                >
                  <span className="size-1.5 rounded-full bg-current" />
                  <span>{statusLabel}</span>
                </span>
                <span className="text-muted-foreground/40">•</span>
                <span>
                  {tList("postedDaysAgo", {
                    days: formatRelativeDays(job.createdAt),
                  })}
                </span>
                <span className="text-muted-foreground/40">•</span>
                <span>{tHiringType(job.hiringType)}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {isEditable && canUpdate && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditOpen(true)}
                    className="h-8 rounded-lg px-3 text-xs font-medium cursor-pointer"
                  >
                    {t("editJob")}
                  </Button>
                )}

                {isOpen && canClose && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isActionLoading}
                    onClick={() => void handleCloseJob()}
                    className="h-8 rounded-lg px-3 text-xs font-medium cursor-pointer"
                  >
                    {t("closeJob")}
                  </Button>
                )}

                {isClosed && canReopen && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isActionLoading}
                    onClick={() => void handleReopenJob()}
                    className="h-8 rounded-lg px-3 text-xs font-medium cursor-pointer"
                  >
                    {t("reopenJob")}
                  </Button>
                )}

                {isDraft && canPublish && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={isActionLoading}
                    onClick={() => setIsPublishDialogOpen(true)}
                    className="h-8 rounded-lg bg-[#0069D3] hover:bg-[#005bb8] text-white px-3.5 text-xs font-medium cursor-pointer"
                  >
                    {t("publishJob")}
                  </Button>
                )}

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => void handleShare()}
                  title={t("shareJob")}
                  aria-label={t("shareJob")}
                  className="size-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <Share2 className="size-3.5" />
                </Button>
              </div>
            </div>

            <h1 className="mt-3 text-2xl sm:text-3xl font-bold tracking-tight text-foreground leading-tight">
              {job.title}
            </h1>

            {/* Key-Value Meta Grid (No icon spam / colored pills) */}
            <div className="mt-5 pt-4 border-t border-border grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <p className="text-xs text-muted-foreground">{t("budget")}</p>
                <p className="mt-1 text-sm sm:text-base font-semibold text-foreground">
                  {formatBudget(job)}
                  {budgetTypeLabel ? (
                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                      ({budgetTypeLabel})
                    </span>
                  ) : null}
                </p>
              </div>

              {job.deadline && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("deadline")}
                  </p>
                  <p className="mt-1 text-sm sm:text-base font-medium text-foreground">
                    {formatDate(job.deadline)}
                  </p>
                </div>
              )}

              {job.expiryDate && (
                <div>
                  <p className="text-xs text-muted-foreground">
                    {t("expiryDate")}
                  </p>
                  <p className="mt-1 text-sm sm:text-base font-medium text-foreground">
                    {formatExpiryText(job.expiryDate)}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Description & Skills Block */}
          <div className="border-t border-border p-5 sm:p-6">
            <h2 className="text-sm font-semibold text-foreground mb-3">
              {t("description")}
            </h2>

            <JobDescription
              description={job.description}
              emptyText={t("noDescription")}
            />

            {job.skills && job.skills.length > 0 && (
              <div className="mt-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                  {t("requiredSkills")}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill) => (
                    <span
                      key={skill.skillId}
                      className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-foreground/80"
                    >
                      {skill.skill.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── AI Recommended Freelancers Section ── */}
        <div className="mt-4">
          <RecommendedFreelancersSection
            jobId={job.id}
            jobTitle={job.title}
            jobStatus={job.status}
          />
        </div>
      </div>

      {/* Edit Job Dialog */}
      {isEditOpen && (
        <PostJobForm
          job={job}
          open={isEditOpen}
          onOpenChange={setIsEditOpen}
          onSaved={handleSaved}
        />
      )}

      {/* Publish Confirmation Dialog */}
      <AlertDialog
        open={isPublishDialogOpen}
        onOpenChange={setIsPublishDialogOpen}
      >
        <AlertDialogContent className="rounded-2xl max-w-md">
          <AlertDialogTitle>{tList("publishConfirmTitle")}</AlertDialogTitle>
          <AlertDialogDescription>
            {tList("publishConfirmDesc")}
          </AlertDialogDescription>
          <div className="mt-4 flex justify-end gap-2">
            <AlertDialogCancel className="rounded-lg">
              {tList("cancel")}
            </AlertDialogCancel>
            <Button
              disabled={isActionLoading}
              className="rounded-lg bg-[#0069D3] hover:bg-[#005bb8] text-white cursor-pointer"
              onClick={() => void handleConfirmPublish()}
            >
              {isActionLoading
                ? tList("publishing")
                : tList("confirmPublish")}
            </Button>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
