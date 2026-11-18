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
  Lock,
  Play,
  RotateCcw,
  Scale,
  Upload,
  User,
} from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";
import { useActionPermission } from "@/hooks/use-action-permission";
import type {
  ContractDetailType,
  GetSubmissionResponseType,
  MilestoneType,
} from "@shared/types";

interface MilestoneOverviewTabProps {
  contract: ContractDetailType;
  milestone: MilestoneType;
  submissions: GetSubmissionResponseType[];
  isFreelancer?: boolean;
  startWorkBlockedReason?: string | null;
  onOpenDispute?: () => void;
  onViewDispute?: () => void;
  onFund?: () => void;
  onStartWork?: () => void;
  onSubmitWork?: () => void;
  onReviewSubmission?: (submission?: GetSubmissionResponseType) => void;
  onRelease?: () => void;
  onRefund?: () => void;
}

export function MilestoneOverviewTab({
  contract,
  milestone,
  submissions,
  isFreelancer = false,
  startWorkBlockedReason = null,
  onOpenDispute,
  onViewDispute,
  onFund,
  onStartWork,
  onSubmitWork,
  onReviewSubmission,
  onRelease,
  onRefund,
}: MilestoneOverviewTabProps) {
  const format = useFormatter();
  const { can, canAny } = useActionPermission();
  const isClient = !isFreelancer;

  const canViewDispute = can("GET", "/api/disputes/milestone/:milestoneId");
  const canCreateDispute = can("POST", "/api/disputes");

  const canFundPermission = canAny([
    { method: "POST", path: "/api/payments/contracts/:contractId/milestones/:milestoneId/fund/intent" },
    { method: "POST", path: "/api/payments/contracts/:contractId/milestones/:milestoneId/fund/checkout-session" },
    { method: "POST", path: "/api/payments/contracts/:contractId/milestones/:milestoneId/fund/saved-card" },
  ]);
  const canReleasePermission = can("POST", "/api/payments/contracts/:contractId/milestones/:milestoneId/release");
  const canRefundPermission = can("POST", "/api/payments/contracts/:contractId/milestones/:milestoneId/refund");
  const canStartWorkPermission = can("PATCH", "/api/contracts/:contractId/milestones/:id/progress");
  const canSubmitWorkPermission = can("POST", "/api/contracts/:contractId/milestones/:milestoneId/submissions");
  const canApprovePermission = can("PATCH", "/api/contracts/:contractId/milestones/:milestoneId/submissions/:id/approve");
  const canRequestChangesPermission = can("PATCH", "/api/contracts/:contractId/milestones/:milestoneId/submissions/:id/request-changes");
  const canReviewPermission = canApprovePermission || canRequestChangesPermission;

  const latestSubmission = submissions.length > 0 ? submissions[0] : null;

  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return "Not specified";
    const d = new Date(date);
    return format.dateTime(d, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (date: string | Date | null | undefined): string => {
    if (!date) return "";
    const d = new Date(date);
    return format.dateTime(d, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getDurationOrDaysRemaining = () => {
    if (milestone.status === "COMPLETED") {
      if (milestone.createdAt && milestone.completedAt) {
        const start = new Date(milestone.createdAt).getTime();
        const end = new Date(milestone.completedAt).getTime();
        const days = Math.max(1, Math.round((end - start) / (1000 * 60 * 60 * 24)));
        return `${days} ${days === 1 ? "day" : "days"} total`;
      }
      return "Completed";
    }

    if (!milestone.dueDate) return "No deadline set";
    const now = new Date().getTime();
    const target = new Date(milestone.dueDate).getTime();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0 || milestone.status === "LATE") {
      const overdue = Math.abs(diffDays);
      return `${overdue} ${overdue === 1 ? "day" : "days"} overdue`;
    }
    if (diffDays === 0) return "Due today";
    return `${diffDays} ${diffDays === 1 ? "day" : "days"} left`;
  };

  const amountNumber = Number(milestone.amount) || 0;
  const freelancerFee = Math.round(amountNumber * 0.05 * 100) / 100;
  const freelancerPayout = Math.round((amountNumber - freelancerFee) * 100) / 100;

  const clientName =
    contract.client?.profile?.displayName ||
    contract.client?.email?.split("@")[0] ||
    "Client";

  const freelancerName =
    contract.freelancer?.profile?.displayName ||
    contract.freelancer?.email?.split("@")[0] ||
    "Freelancer";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-1">
      {/* ── Left Column: Main Deliverables & Workflow Workspace (8 Cols) ── */}
      <div className="lg:col-span-8 space-y-5">
        {/* ── Status Guidance Notice (Clean line, NO colored background boxes) ── */}
        {milestone.status === "DISPUTED" && (
          <div className="flex items-start justify-between gap-3 border-l-2 border-rose-500 pl-3 py-1 text-xs">
            <div className="space-y-0.5">
              <span className="font-medium text-rose-600 block">
                Milestone is under formal dispute
              </span>
              <p className="text-muted-foreground leading-relaxed">
                Escrow funds remain frozen while Frevia dispute arbiters review evidence from both parties.
              </p>
            </div>
            {canViewDispute && onViewDispute && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewDispute}
                className="h-7 text-xs text-rose-600 shrink-0 cursor-pointer"
              >
                View Dispute
              </Button>
            )}
          </div>
        )}

        {milestone.status === "COMPLETED" && (
          <div className="flex items-start gap-2.5 border-l-2 border-emerald-500 pl-3 py-1 text-xs">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-medium text-foreground block">
                Milestone completed and payment released
              </span>
              <p className="text-muted-foreground leading-relaxed">
                Deliverables approved. Payout of ${freelancerPayout.toFixed(2)} USD transferred to {freelancerName} (5% platform fee deducted).
              </p>
            </div>
          </div>
        )}

        {milestone.status === "SUBMITTED" && (
          <div className="flex items-start gap-2.5 border-l-2 border-[#0069D3] pl-3 py-1 text-xs">
            <FileCheck className="size-4 text-[#0069D3] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-medium text-foreground block">
                Work delivered and awaiting client review
              </span>
              <p className="text-muted-foreground leading-relaxed">
                Freelancer submitted deliverables on {formatDateTime(latestSubmission?.submittedAt)}. Client has 7 days to review. If no response is received, funds will be released automatically.
              </p>
            </div>
          </div>
        )}

        {milestone.status === "LATE" && (
          <div className="flex items-start justify-between gap-3 border-l-2 border-rose-500 pl-3 py-1 text-xs">
            <div className="space-y-0.5">
              <span className="font-medium text-rose-600 block">
                Milestone is overdue (Late)
              </span>
              <p className="text-muted-foreground leading-relaxed">
                The agreed delivery deadline has passed without a submission.
                {milestone.paymentStatus === "FUNDED" && isClient
                  ? " As client, you may request an immediate escrow refund to your card."
                  : ""}
              </p>
            </div>
            {isClient &&
              milestone.paymentStatus === "FUNDED" &&
              canRefundPermission &&
              onRefund && (
                <Button
                  size="sm"
                  onClick={onRefund}
                  className="h-7 text-xs font-normal text-rose-600 border border-rose-200 dark:border-rose-800 bg-transparent hover:bg-rose-50 dark:hover:bg-rose-950/20 shrink-0 cursor-pointer"
                >
                  <RotateCcw className="mr-1 size-3" />
                  Refund Escrow
                </Button>
              )}
          </div>
        )}

        {milestone.status === "CHANGES_REQUESTED" && (
          <div className="flex items-start gap-2.5 border-l-2 border-amber-500 pl-3 py-1 text-xs">
            <RotateCcw className="size-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-medium text-amber-600 block">
                Revisions requested by client
              </span>
              <p className="text-muted-foreground leading-relaxed">
                The client requested modifications. Please review feedback notes below and submit updated deliverables.
              </p>
            </div>
          </div>
        )}

        {milestone.status === "IN_PROGRESS" && (
          <div className="flex items-start justify-between gap-3 border-l-2 border-border pl-3 py-1 text-xs">
            <div className="space-y-0.5">
              <span className="font-medium text-foreground block">
                Work in progress
              </span>
              <p className="text-muted-foreground leading-relaxed">
                Milestone is actively underway. Escrow funds of ${amountNumber.toFixed(2)} USD are safely held in protection.
              </p>
            </div>
            {isFreelancer && canSubmitWorkPermission && onSubmitWork && (
              <Button
                size="sm"
                onClick={onSubmitWork}
                className="h-7 rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-normal px-3 shrink-0 cursor-pointer"
              >
                <Upload className="mr-1 size-3" />
                Deliver Work
              </Button>
            )}
          </div>
        )}

        {milestone.status === "PENDING" && milestone.paymentStatus === "FUNDED" && (
          <div className="flex items-start justify-between gap-3 border-l-2 border-emerald-500 pl-3 py-1 text-xs">
            <div className="space-y-0.5">
              <span className="font-medium text-emerald-600 block">
                {isFreelancer && startWorkBlockedReason
                  ? "Escrow funded · Locked until prior milestone completes"
                  : "Escrow funded & ready to start"}
              </span>
              <p className="text-muted-foreground leading-relaxed">
                {isFreelancer && startWorkBlockedReason
                  ? `${startWorkBlockedReason} before starting work on this milestone.`
                  : `Client deposited $${amountNumber.toFixed(2)} USD in escrow. Freelancer can begin working.`}
              </p>
            </div>
            {isFreelancer && canStartWorkPermission && onStartWork && (
              <Button
                size="sm"
                disabled={Boolean(startWorkBlockedReason)}
                title={startWorkBlockedReason ?? undefined}
                onClick={onStartWork}
                className="h-7 rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-normal px-3 shrink-0 cursor-pointer disabled:opacity-50"
              >
                {startWorkBlockedReason ? (
                  <Lock className="mr-1 size-3" />
                ) : (
                  <Play className="mr-1 size-3" />
                )}
                Start Work
              </Button>
            )}
          </div>
        )}

        {milestone.status === "PENDING" && milestone.paymentStatus === "PENDING" && (
          <div className="flex items-start justify-between gap-3 border-l-2 border-border pl-3 py-1 text-xs">
            <div className="space-y-0.5">
              <span className="font-medium text-foreground block">
                Awaiting escrow deposit
              </span>
              <p className="text-muted-foreground leading-relaxed">
                Client must fund the milestone escrow before the freelancer begins work.
              </p>
            </div>
            {isClient && canFundPermission && onFund && (
              <Button
                size="sm"
                onClick={onFund}
                className="h-7 rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-normal px-3 shrink-0 cursor-pointer"
              >
                <CreditCard className="mr-1 size-3" />
                Fund Escrow
              </Button>
            )}
          </div>
        )}

        {/* ── Deliverables Section ── */}
        {latestSubmission ? (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
              <h3 className="text-xs font-semibold text-foreground">
                Latest Deliverable Submission
              </h3>
              <span className="text-[11px] text-muted-foreground font-mono">
                {formatDateTime(latestSubmission.submittedAt)}
              </span>
            </div>

            {/* Freelancer message */}
            {latestSubmission.message && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">
                  Notes from {freelancerName}:
                </span>
                <p className="text-xs text-foreground leading-relaxed whitespace-pre-wrap pl-3 border-l-2 border-border/60 py-0.5">
                  {latestSubmission.message}
                </p>
              </div>
            )}

            {/* Attached Deliverable Files */}
            {latestSubmission.files && latestSubmission.files.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground">
                  Deliverable Files:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {latestSubmission.files.map((item) => (
                    <div
                      key={item.fileId}
                      className="flex items-center justify-between gap-2 p-2 rounded-md border border-border/50 bg-transparent hover:bg-muted/10 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="size-3.5 text-[#0069D3] shrink-0" />
                        <span className="text-xs font-normal text-foreground truncate max-w-[180px]">
                          {item.file?.fileName || `Deliverable File #${item.fileId}`}
                        </span>
                      </div>
                      {item.file?.fileUrl && (
                        <a
                          href={item.file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          title="Download File"
                        >
                          <Download className="size-3.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* External Links */}
            {latestSubmission.links && latestSubmission.links.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">
                  Project Links:
                </span>
                <div className="flex flex-wrap gap-2">
                  {latestSubmission.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-md border border-border/60 px-2.5 py-1 text-xs text-[#0069D3] hover:underline"
                    >
                      <ExternalLink className="size-3" />
                      <span className="truncate max-w-[240px]">{link}</span>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Client Revision Feedback note if revision requested */}
            {latestSubmission.changeRequestMessage && (
              <div className="border-l-2 border-amber-500 pl-3 py-1 text-xs space-y-1">
                <span className="font-medium text-amber-600 block">
                  Revisions Requested by {clientName}:
                </span>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {latestSubmission.changeRequestMessage}
                </p>
                {latestSubmission.changeRequestDueDate && (
                  <span className="block text-[11px] text-muted-foreground">
                    Target revision date: {formatDate(latestSubmission.changeRequestDueDate)}
                  </span>
                )}
              </div>
            )}

            {/* Direct Contextual Actions Bar */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2">
              {isClient && milestone.status === "SUBMITTED" && canReviewPermission && onReviewSubmission && (
                <Button
                  size="sm"
                  onClick={() => onReviewSubmission(latestSubmission)}
                  className="h-8 rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-normal px-4 cursor-pointer"
                >
                  <Check className="mr-1.5 size-3.5" />
                  Review & Approve Delivery
                </Button>
              )}

              {isFreelancer &&
                milestone.status === "CHANGES_REQUESTED" &&
                canSubmitWorkPermission &&
                onSubmitWork && (
                  <Button
                    size="sm"
                    onClick={onSubmitWork}
                    className="h-8 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-normal px-4 cursor-pointer"
                  >
                    <RotateCcw className="mr-1.5 size-3.5" />
                    Resubmit Updated Work
                  </Button>
                )}

              {isClient &&
                milestone.status === "COMPLETED" &&
                milestone.paymentStatus === "FUNDED" &&
                canReleasePermission &&
                onRelease && (
                  <Button
                    size="sm"
                    onClick={onRelease}
                    className="h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-normal px-4 cursor-pointer"
                  >
                    <Check className="mr-1.5 size-3.5" />
                    Release Payment
                  </Button>
                )}
            </div>
          </div>
        ) : (
          /* Empty Deliverables State */
          <div className="py-6 text-center space-y-1.5 border-b border-border/40">
            <Clock className="size-5 mx-auto text-muted-foreground/60" />
            <h4 className="text-xs font-medium text-foreground">
              No deliverables submitted yet
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {isFreelancer
                ? "Once work is ready, use Deliver Work to upload files and notes."
                : "Deliverables will appear here once submitted by the freelancer."}
            </p>
            {isFreelancer &&
              (milestone.status === "IN_PROGRESS" || milestone.status === "LATE") &&
              canSubmitWorkPermission &&
              onSubmitWork && (
                <Button
                  size="sm"
                  onClick={onSubmitWork}
                  className="rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-normal px-3.5 mt-2 cursor-pointer"
                >
                  <Upload className="mr-1.5 size-3.5" />
                  Deliver Work Now
                </Button>
              )}
          </div>
        )}

        {/* ── Scope & Requirements ── */}
        <div className="space-y-2 pt-3 border-t border-border/40">
          <h3 className="text-xs font-semibold text-foreground">
            Scope of Deliverables
          </h3>
          <div className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
            {milestone.description || (
              <span className="text-muted-foreground italic">
                No detailed scope description specified for this milestone.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Right Column: Milestone Summary & Counterparty (4 Cols) ── */}
      <div className="lg:col-span-4 space-y-5 lg:pl-5 lg:border-l lg:border-border/40">
        {/* Financial Summary */}
        <div className="space-y-2.5">
          <span className="text-xs font-medium text-muted-foreground">
            Milestone Financials
          </span>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Budget:</span>
              <span className="font-mono font-medium text-foreground">
                ${amountNumber.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Freelancer Fee (5%):</span>
              <span className="font-mono text-muted-foreground">
                -${freelancerFee.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border/30">
              <span className="text-foreground">Freelancer Net (95%):</span>
              <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                ${freelancerPayout.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Schedule & Timeline Summary */}
        <div className="space-y-2.5 pt-3 border-t border-border/40">
          <span className="text-xs font-medium text-muted-foreground">
            Timeline
          </span>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Target Deadline:</span>
              <span className="font-mono text-foreground">
                {formatDate(milestone.dueDate)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Time Status:</span>
              <span className="text-foreground">
                {getDurationOrDaysRemaining()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span className="text-muted-foreground">
                {formatDate(milestone.createdAt)}
              </span>
            </div>
            {milestone.completedAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Completed:</span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  {formatDate(milestone.completedAt)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Participants (Client & Freelancer) */}
        <div className="space-y-2.5 pt-3 border-t border-border/40">
          <span className="text-xs font-medium text-muted-foreground">
            Participants
          </span>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-full border border-border text-muted-foreground">
                <User className="size-3" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-foreground truncate block">
                  {clientName}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Client
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex size-6 items-center justify-center rounded-full border border-border text-muted-foreground">
                <User className="size-3" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-foreground truncate block">
                  {freelancerName}
                </span>
                <span className="text-[10px] text-muted-foreground block">
                  Freelancer
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Dispute Action (if eligible) */}
        {milestone.status !== "COMPLETED" &&
          milestone.status !== "DISPUTED" &&
          milestone.paymentStatus === "FUNDED" &&
          canCreateDispute &&
          onOpenDispute && (
            <div className="pt-3 border-t border-border/40">
              <Button
                variant="ghost"
                size="sm"
                onClick={onOpenDispute}
                className="w-full justify-start text-xs text-muted-foreground hover:text-rose-600 px-0 h-auto cursor-pointer"
              >
                <Scale className="mr-1.5 size-3.5" />
                Having an issue? Open a dispute claim
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}
