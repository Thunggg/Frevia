"use client";

import { useFormatter } from "next-intl";
import {
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Download,
  ExternalLink,
  FileCheck,
  FileText,
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
  onFund?: () => void;
  onStartWork?: () => void;
  onSubmitWork?: () => void;
  onReviewSubmission?: (submission?: GetSubmissionResponseType) => void;
  onRelease?: () => void;
  onRefund?: () => void;
}

export function MilestoneSubmissionsTab({
  contractStatus,
  milestone,
  submissions,
  isFreelancer = false,
  onFund,
  onStartWork,
  onSubmitWork,
  onReviewSubmission,
  onRelease,
  onRefund,
}: MilestoneSubmissionsTabProps) {
  const format = useFormatter();
  const { can, canAny } = useActionPermission();
  const isClient = !isFreelancer;

  const canViewSubmissions = can("GET", "/api/contracts/:contractId/milestones/:milestoneId/submissions");
  const canViewSubmissionDetail = can("GET", "/api/contracts/:contractId/milestones/:milestoneId/submissions/:id");
  const canApprove = can("PATCH", "/api/contracts/:contractId/milestones/:milestoneId/submissions/:id/approve");
  const canRequestChanges = can("PATCH", "/api/contracts/:contractId/milestones/:milestoneId/submissions/:id/request-changes");
  const canReview = canApprove || canRequestChanges;

  const canFund = canAny([
    { method: "POST", path: "/api/payments/contracts/:contractId/milestones/:milestoneId/fund/intent" },
    { method: "POST", path: "/api/payments/contracts/:contractId/milestones/:milestoneId/fund/checkout-session" },
    { method: "POST", path: "/api/payments/contracts/:contractId/milestones/:milestoneId/fund/saved-card" },
  ]);
  const canRelease = can("POST", "/api/payments/contracts/:contractId/milestones/:milestoneId/release");
  const canRefund = can("POST", "/api/payments/contracts/:contractId/milestones/:milestoneId/refund");
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
          Fund Escrow
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
          Review Delivery
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
          Release Payment
        </Button>
      );
    }

    if (
      isClient &&
      contractStatus === "ACTIVE" &&
      milestone.paymentStatus === "FUNDED" &&
      (milestone.status === "LATE" || milestone.status === "PENDING") &&
      canRefund &&
      onRefund
    ) {
      return (
        <Button
          variant="outline"
          onClick={onRefund}
          className="rounded-full border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-xs font-normal h-7 px-3.5 cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="mr-1.5 size-3" />
          Refund Escrow
        </Button>
      );
    }

    if (
      isFreelancer &&
      milestone.status === "PENDING" &&
      milestone.paymentStatus === "FUNDED" &&
      canStartWork &&
      onStartWork
    ) {
      return (
        <Button
          onClick={onStartWork}
          className="rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-normal h-7 px-3.5 cursor-pointer self-start sm:self-auto"
        >
          <Play className="mr-1.5 size-3" />
          Start Milestone
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
              Resubmit
            </>
          ) : (
            <>
              <Upload className="mr-1.5 size-3" />
              Deliver Work
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
            <CheckCircle2 className="size-3.5" /> Approved
          </span>
        );
      case "CHANGES_REQUESTED":
        return (
          <span className="inline-flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium">
            <RotateCcw className="size-3.5" /> Revisions Requested
          </span>
        );
      case "SUBMITTED":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs text-[#0069D3] dark:text-blue-400 font-medium">
            <FileCheck className="size-3.5" /> In Review
          </span>
        );
    }
  };

  if (!canViewSubmissions) {
    return (
      <div className="py-8 text-center space-y-2">
        <h3 className="text-xs font-medium text-foreground">
          Không có quyền xem danh sách bài nộp
        </h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Tài khoản của bạn chưa được cấp quyền xem danh sách các bài nộp deliverable của milestone này.
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
            Deliverables & Submissions History
          </h3>
          <p className="text-[11px] text-muted-foreground">
            History of submitted deliverables and review decisions
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
                      Delivery #{attemptNumber}
                    </span>
                    {isLatest && (
                      <span className="text-[10px] text-[#0069D3] font-medium">
                        (Latest)
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
                {canViewSubmissionDetail && (
                  <div className="space-y-2">
                    {/* Freelancer Notes */}
                    {sub.message && (
                      <div className="space-y-0.5">
                        <span className="text-xs text-muted-foreground">
                          Notes:
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
                          Links:
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
                          Files:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {sub.files.map((item) => (
                            <div
                              key={item.fileId}
                              className="inline-flex items-center gap-2 rounded-md border border-border/50 px-2.5 py-1 text-xs text-foreground"
                            >
                              <FileText className="size-3.5 text-[#0069D3]" />
                              <span className="truncate max-w-[220px]">
                                {item.file?.fileName || `File #${item.fileId}`}
                              </span>
                              {item.file?.fileUrl && (
                                <a
                                  href={item.file.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download
                                  className="text-muted-foreground hover:text-foreground ml-1"
                                  title="Download"
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
                )}

                {/* Review Feedback: Approved or Revisions requested */}
                {sub.status === "APPROVED" && sub.reviewedAt && (
                  <div className="text-xs flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="size-3.5 shrink-0" />
                    <span>
                      Approved on {formatDate(sub.reviewedAt)}. Payment released.
                    </span>
                  </div>
                )}

                {sub.changeRequestMessage && (
                  <div className="border-l-2 border-amber-500 pl-3 py-1 text-xs space-y-0.5">
                    <span className="font-medium text-amber-600 block">
                      Client Revision Feedback:
                    </span>
                    <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                      {sub.changeRequestMessage}
                    </p>
                    {sub.changeRequestDueDate && (
                      <span className="block text-[11px] text-muted-foreground">
                        Target revision deadline: {formatDate(sub.changeRequestDueDate)}
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
                      Review & Approve Delivery
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
            No submissions yet
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Submissions will appear here once the freelancer delivers work for this milestone.
          </p>
        </div>
      )}
    </div>
  );
}
