"use client";

import { useFormatter, useTranslations } from "next-intl";
import {
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  FileCheck,
  FileText,
  Lock,
  Play,
  RotateCcw,
  Upload,
} from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";
import { useActionPermission } from "@/hooks/use-action-permission";
import type {
  ContractDetailType,
  GetSubmissionResponseType,
  MilestoneType,
} from "@shared/types";

interface MilestoneSubmissionsTabProps {
  contractStatus: ContractDetailType["status"];
  milestone: MilestoneType;
  submissions: GetSubmissionResponseType[];
  isFreelancer?: boolean;
  startWorkBlockedReason?: string | null;
  onFund?: () => void;
  onStartWork?: () => void;
  onSubmitWork?: () => void;
  onReviewSubmission?: (submission?: GetSubmissionResponseType) => void;
  onRelease?: () => void;
}

export function MilestoneSubmissionsTab({
  contractStatus,
  milestone,
  submissions,
  isFreelancer = false,
  startWorkBlockedReason = null,
  onFund,
  onStartWork,
  onSubmitWork,
  onReviewSubmission,
  onRelease,
}: MilestoneSubmissionsTabProps) {
  const format = useFormatter();
  const t = useTranslations("milestoneWorkspace.submissions");
  const tCard = useTranslations("milestoneWorkspace.card");
  const tOverview = useTranslations("milestoneWorkspace.overview");
  const { can, canAny, isLoading: isPermissionLoading } = useActionPermission();
  const isClient = !isFreelancer;

  const canViewSubmissions = can("GET", "/api/contracts/:contractId/milestones/:milestoneId/submissions");
  const canApprove = can("PATCH", "/api/contracts/:contractId/milestones/:milestoneId/submissions/:id/approve");
  const canRequestChanges = can("PATCH", "/api/contracts/:contractId/milestones/:milestoneId/submissions/:id/request-changes");
  const canReview = canApprove || canRequestChanges;

  const canFund = canAny([
    { method: "POST", path: "/api/payments/contracts/:contractId/milestones/:milestoneId/fund/intent" },
    { method: "POST", path: "/api/payments/contracts/:contractId/milestones/:milestoneId/fund/checkout-session" },
    { method: "POST", path: "/api/payments/contracts/:contractId/milestones/:milestoneId/fund/saved-card" },
  ]);
  const canRelease = can("POST", "/api/payments/contracts/:contractId/milestones/:milestoneId/release");
  const canStartWork = can("PATCH", "/api/contracts/:contractId/milestones/:id/progress");
  const canSubmitWork = can("POST", "/api/contracts/:contractId/milestones/:milestoneId/submissions");

  const renderPrimaryAction = () => {
    if (
      isClient &&
      contractStatus === "ACTIVE" &&
      milestone.paymentStatus === "PENDING" &&
      canFund &&
      onFund
    ) {
      return (
        <Button
          onClick={onFund}
          className="rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-normal h-7 px-3.5 cursor-pointer self-start sm:self-auto"
        >
          <CreditCard className="mr-1.5 size-3" />
          {tCard("fundEscrow")}
        </Button>
      );
    }

    if (isClient && milestone.status === "SUBMITTED" && canReview && onReviewSubmission) {
      return (
        <Button
          onClick={() => onReviewSubmission()}
          className="rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-normal h-7 px-3.5 cursor-pointer self-start sm:self-auto"
        >
          <FileCheck className="mr-1.5 size-3" />
          {tCard("reviewDelivery")}
        </Button>
      );
    }

    if (
      isClient &&
      milestone.status === "COMPLETED" &&
      milestone.paymentStatus === "FUNDED" &&
      canRelease &&
      onRelease
    ) {
      return (
        <Button
          onClick={onRelease}
          className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-normal h-7 px-3.5 cursor-pointer self-start sm:self-auto"
        >
          <Check className="mr-1.5 size-3" />
          {tCard("releasePayment")}
        </Button>
      );
    }

    if (
      isFreelancer &&
      (milestone.status === "PENDING" ||
        (milestone.status === "LATE" && submissions.length === 0)) &&
      milestone.paymentStatus === "FUNDED" &&
      canStartWork &&
      onStartWork
    ) {
      return (
        <Button
          disabled={Boolean(startWorkBlockedReason)}
          title={startWorkBlockedReason ?? undefined}
          onClick={onStartWork}
          className="rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-normal h-7 px-3.5 cursor-pointer self-start sm:self-auto disabled:opacity-50"
        >
          {startWorkBlockedReason ? (
            <Lock className="mr-1.5 size-3" />
          ) : (
            <Play className="mr-1.5 size-3" />
          )}
          {tCard("startMilestone")}
        </Button>
      );
    }

    if (
      isFreelancer &&
      (milestone.status === "IN_PROGRESS" ||
        milestone.status === "CHANGES_REQUESTED" ||
        milestone.status === "LATE") &&
      canSubmitWork &&
      onSubmitWork
    ) {
      const isResubmit = milestone.status === "CHANGES_REQUESTED";
      return (
        <Button
          onClick={onSubmitWork}
          className={
            isResubmit
              ? "rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-normal h-7 px-3.5 cursor-pointer self-start sm:self-auto"
              : "rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-normal h-7 px-3.5 cursor-pointer self-start sm:self-auto"
          }
        >
          {isResubmit ? (
            <>
              <RotateCcw className="mr-1.5 size-3" />
              {tCard("resubmit")}
            </>
          ) : (
            <>
              <Upload className="mr-1.5 size-3" />
              {tCard("deliverWork")}
            </>
          )}
        </Button>
      );
    }

    return null;
  };

  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return "";
    const d = new Date(date);
    return format.dateTime(d, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getSubmissionStatusText = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
            <CheckCircle2 className="size-3.5" /> {t("statusApproved")}
          </span>
        );
      case "CHANGES_REQUESTED":
        return (
          <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
            <RotateCcw className="size-3.5" /> {t("statusChanges")}
          </span>
        );
      case "SUBMITTED":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs text-[#0069D3] dark:text-blue-400 font-medium">
            <FileCheck className="size-3.5" /> {t("statusInReview")}
          </span>
        );
    }
  };

  if (!isPermissionLoading && !canViewSubmissions) {
    return (
      <div className="py-8 text-center space-y-2">
        <h3 className="text-xs font-medium text-foreground">
          {t("noPermissionTitle")}
        </h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          {t("noPermissionDesc")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-1">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-2.5">
        <div>
          <h3 className="text-xs font-semibold text-foreground">
            {t("heading")}
          </h3>
          <p className="text-[11px] text-muted-foreground">
            {t("subheading")}
          </p>
        </div>

        {renderPrimaryAction()}
      </div>

      {submissions.length > 0 ? (
        <div className="divide-y divide-border/30">
          {submissions.map((sub, idx) => {
            const attemptNumber = submissions.length - idx;
            const isLatest = idx === 0;

            return (
              <div key={sub.id} className="py-4 space-y-2.5">
                {/* Header: Attempt, Timestamp & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-medium text-foreground">
                      {t("deliveryNumber", { number: attemptNumber })}
                    </span>
                    {isLatest && (
                      <span className="text-[10px] text-[#0069D3] font-medium">
                        {t("latestBadge")}
                      </span>
                    )}
                    <span className="text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground font-mono">
                      {formatDate(sub.submittedAt)}
                    </span>
                  </div>

                  <div>{getSubmissionStatusText(sub.status)}</div>
                </div>

                {/* Freelancer Notes, Links & Files */}
                <div className="space-y-2">
                    {/* Freelancer Notes */}
                    {sub.message && (
                      <div className="space-y-0.5">
                        <span className="text-xs text-muted-foreground">
                          {t("notesLabel")}
                        </span>
                        <p className="pl-3 border-l-2 border-border/60 py-0.5 text-xs text-foreground leading-relaxed whitespace-pre-wrap">
                          {sub.message}
                        </p>
                      </div>
                    )}

                    {/* Preview / External Links */}
                    {sub.links && sub.links.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">
                          {t("linksLabel")}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {sub.links.map((link, lIdx) => (
                            <a
                              key={lIdx}
                              href={link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-md border border-border/50 px-2 py-0.5 text-xs text-[#0069D3] hover:underline"
                            >
                              <ExternalLink className="size-3" />
                              <span className="truncate max-w-[280px]">{link}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Attached Files */}
                    {sub.files && sub.files.length > 0 && (
                      <div className="space-y-1">
                        <span className="text-xs text-muted-foreground">
                          {t("filesLabel")}
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {sub.files.map((item) => (
                            <div
                              key={item.fileId}
                              className="inline-flex items-center gap-2 rounded-md border border-border/50 px-2.5 py-1 text-xs text-foreground"
                            >
                              <FileText className="size-3.5 text-[#0069D3]" />
                              <span className="truncate max-w-[220px]">
                                {item.file?.fileName ||
                                  t("fileFallback", { id: item.fileId })}
                              </span>
                              {item.file?.fileUrl && (
                                <a
                                  href={item.file.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                  className="text-muted-foreground hover:text-foreground ml-1"
                                  title={t("download")}
                                >
                                  <Download className="size-3.5" />
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                {/* Review Feedback: Approved or Revisions requested */}
                {sub.status === "APPROVED" && sub.reviewedAt && (
                  <div className="text-xs flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3.5 shrink-0" />
                    <span>
                      {t("approvedOn", { date: formatDate(sub.reviewedAt) })}
                    </span>
                  </div>
                )}

                {sub.changeRequestMessage && (
                  <div className="border-l-2 border-amber-500 pl-3 py-1 text-xs space-y-0.5">
                    <span className="font-medium text-amber-600 block">
                      {t("clientFeedback")}
                    </span>
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {sub.changeRequestMessage}
                    </p>
                    {sub.changeRequestDueDate && (
                      <span className="block text-[11px] text-muted-foreground">
                        {t("targetRevisionDeadline", {
                          date: formatDate(sub.changeRequestDueDate),
                        })}
                      </span>
                    )}
                  </div>
                )}

                {/* Client Review Action for latest unapproved submission */}
                {isClient && isLatest && milestone.status === "SUBMITTED" && canReview && onReviewSubmission && (
                  <div className="pt-1.5 flex justify-end">
                    <Button
                      size="sm"
                      onClick={() => onReviewSubmission(sub)}
                      className="rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-normal h-7 px-3.5 cursor-pointer"
                    >
                      <Check className="mr-1.5 size-3" />
                      {tOverview("reviewApproveDelivery")}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-10 text-center space-y-1.5">
          <Clock className="size-5 mx-auto text-muted-foreground/60" />
          <h4 className="text-xs font-medium text-foreground">
            {t("emptyTitle")}
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {t("emptyDesc")}
          </p>
        </div>
      )}
    </div>
  );
}
