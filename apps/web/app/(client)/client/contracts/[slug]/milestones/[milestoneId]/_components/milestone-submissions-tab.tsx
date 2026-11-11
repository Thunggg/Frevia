"use client";

import { useFormatter } from "next-intl";
import {
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
}: MilestoneSubmissionsTabProps) {
  const format = useFormatter();
  const isClient = !isFreelancer;

  const renderPrimaryAction = () => {
    if (
      isClient &&
      contractStatus === "ACTIVE" &&
      milestone.paymentStatus === "PENDING" &&
      onFund
    ) {
      return (
        <Button
          onClick={onFund}
          className="rounded-lg bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold h-9 px-4 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <CreditCard className="mr-1.5 size-3.5" />
          Fund Escrow
        </Button>
      );
    }

    if (isClient && milestone.status === "SUBMITTED" && onReviewSubmission) {
      return (
        <Button
          onClick={() => onReviewSubmission()}
          className="rounded-lg bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold h-9 px-4 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <FileCheck className="mr-1.5 size-3.5" />
          Review Submission
        </Button>
      );
    }

    if (
      isClient &&
      milestone.status === "COMPLETED" &&
      milestone.paymentStatus === "FUNDED" &&
      onRelease
    ) {
      return (
        <Button
          onClick={onRelease}
          className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold h-9 px-4 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <CreditCard className="mr-1.5 size-3.5" />
          Release Payment
        </Button>
      );
    }

    if (
      isFreelancer &&
      milestone.status === "PENDING" &&
      milestone.paymentStatus === "FUNDED" &&
      onStartWork
    ) {
      return (
        <Button
          onClick={onStartWork}
          className="rounded-lg bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold h-9 px-4 shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Play className="mr-1.5 size-3.5" />
          Start Milestone
        </Button>
      );
    }

    if (
      isFreelancer &&
      (milestone.status === "IN_PROGRESS" || milestone.status === "CHANGES_REQUESTED") &&
      onSubmitWork
    ) {
      const isResubmit = milestone.status === "CHANGES_REQUESTED";
      return (
        <Button
          onClick={onSubmitWork}
          className={
            isResubmit
              ? "rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold h-9 px-4 shadow-xs cursor-pointer self-start sm:self-auto"
              : "rounded-lg bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold h-9 px-4 shadow-xs cursor-pointer self-start sm:self-auto"
          }
        >
          {isResubmit ? (
            <>
              <RotateCcw className="mr-1.5 size-3.5" />
              Resubmit Deliverables
            </>
          ) : (
            <>
              <Upload className="mr-1.5 size-3.5" />
              Submit Deliverables
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

  // Status with NO border and NO background
  const getSubmissionStatus = (status: string) => {
    switch (status) {
      case "APPROVED":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3.5" /> Approved & Released
          </span>
        );
      case "CHANGES_REQUESTED":
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <RotateCcw className="size-3.5" /> Changes Requested
          </span>
        );
      case "SUBMITTED":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#0069D3] dark:text-blue-400">
            <FileCheck className="size-3.5" /> Ready for Review
          </span>
        );
    }
  };

  return (
    <div className="space-y-5">
      {/* Top action header for freelancer or client */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
        <div>
          <h3 className="text-sm font-medium text-zinc-950 dark:text-zinc-50">
            Work Submissions & Deliverables
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Full history of submitted files, code repository links, and client review decisions.
          </p>
        </div>

        {renderPrimaryAction()}
      </div>

      {submissions.length > 0 ? (
        <div className="space-y-3.5">
          {submissions.map((sub, idx) => {
            const attemptNumber = submissions.length - idx;
            const isLatest = idx === 0;

            return (
              <div
                key={sub.id}
                className={`rounded-sm border bg-white dark:bg-zinc-950 p-5 shadow-2xs space-y-3.5 transition-all ${isLatest
                  ? "border-zinc-300 dark:border-zinc-700"
                  : "border-zinc-200/80 dark:border-zinc-800/80"
                  }`}
              >
                {/* Header: Attempt, Timestamp & Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800/80 pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-zinc-950 dark:text-zinc-100">
                      Attempt #{attemptNumber}
                    </span>
                    {isLatest && (
                      <span className="text-[10px] font-bold text-[#0069D3]">
                        ● Latest
                      </span>
                    )}
                    <span className="text-zinc-300 dark:text-zinc-700">•</span>
                    <span className="text-xs text-zinc-400">
                      {formatDate(sub.submittedAt)}
                    </span>
                  </div>

                  <div>{getSubmissionStatus(sub.status)}</div>
                </div>

                {/* Freelancer Notes */}
                {sub.message && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Freelancer Notes:
                    </span>
                    <p className="p-3 rounded-sm border border-zinc-200/60 dark:border-zinc-800/60 bg-zinc-50/50 dark:bg-zinc-900/30 text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 leading-relaxed whitespace-pre-wrap">
                      {sub.message}
                    </p>
                  </div>
                )}

                {/* Preview / External Links */}
                {sub.links && sub.links.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Project Links:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {sub.links.map((link, lIdx) => (
                        <a
                          key={lIdx}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1 text-xs text-[#0069D3] hover:underline"
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
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                      Submitted Files:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {sub.files.map((item) => (
                        <div
                          key={item.fileId}
                          className="inline-flex items-center gap-2 rounded-sm border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3 py-1.5 text-xs text-zinc-800 dark:text-zinc-200"
                        >
                          <FileText className="size-3.5 text-zinc-400" />
                          <span className="truncate max-w-[220px] font-medium">
                            {item.file?.fileName || `Deliverable File #${item.fileId}`}
                          </span>
                          {item.file?.fileUrl && (
                            <a
                              href={item.file.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download
                              className="text-[#0069D3] hover:underline ml-1"
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
                  <div className="rounded-sm border border-amber-200 dark:border-amber-900/60 p-3 text-xs space-y-1 bg-amber-50/20 dark:bg-amber-950/20">
                    <span className="font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 block text-[11px]">
                      Client Revision Feedback:
                    </span>
                    <p className="text-zinc-800 dark:text-zinc-200 leading-relaxed whitespace-pre-wrap">
                      {sub.changeRequestMessage}
                    </p>
                    {sub.changeRequestDueDate && (
                      <span className="block pt-0.5 text-[11px] text-amber-600 dark:text-amber-400">
                        Requested completion by: {formatDate(sub.changeRequestDueDate)}
                      </span>
                    )}
                  </div>
                )}

                {/* Client Review Action for latest unapproved submission */}
                {isClient && isLatest && milestone.status === "SUBMITTED" && onReviewSubmission && (
                  <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex justify-end">
                    <Button
                      onClick={() => onReviewSubmission(sub)}
                      className="rounded-sm bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold h-8 px-3 cursor-pointer"
                    >
                      <FileCheck className="mr-1.5 size-3.5" />
                      Review & Approve / Request Changes
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-sm border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-12 text-center space-y-3">
          <Clock className="size-8 mx-auto text-zinc-400" />
          <h4 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
            No work submissions yet
          </h4>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            {isFreelancer
              ? milestone.status === "PENDING" && milestone.paymentStatus === "FUNDED"
                ? "Escrow is funded. Click Start Milestone above when you are ready to begin and submit deliverables."
                : "Once you complete work for this milestone, you can upload source files, demos, or code repository links here."
              : contractStatus === "ACTIVE" && milestone.paymentStatus === "PENDING"
                ? "Fund escrow for this milestone using the button above so the freelancer can begin work."
                : "The freelancer will submit project deliverables here once ready for your review."}
          </p>
        </div>
      )}
    </div>
  );
}
