"use client";

import { useFormatter } from "next-intl";
import {
  AlertTriangle,
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
  ShieldCheck,
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
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">
      {/* ── Left Column: Main Deliverables & Workflow Workspace (8 Cols) ── */}
      <div className="lg:col-span-8 space-y-6">
        {/* ── 1. Fiverr-Style Status Banner (Subtle & Informative) ── */}
        {milestone.status === "DISPUTED" && (
          <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 p-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Scale className="size-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-rose-600">
                  Milestone is under formal dispute
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  A formal dispute claim has been filed for this milestone. Escrow funds remain safely frozen while dispute arbiters review evidence.
                </p>
              </div>
            </div>
            {canViewDispute && onViewDispute && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewDispute}
                className="h-8 rounded-full border-rose-200 dark:border-rose-800 bg-white dark:bg-zinc-900 text-xs text-rose-600 hover:bg-rose-50 shrink-0 cursor-pointer"
              >
                View Dispute
              </Button>
            )}
          </div>
        )}

        {milestone.status === "COMPLETED" && (
          <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20 p-4 flex items-start gap-3">
            <CheckCircle2 className="size-4 shrink-0 text-emerald-600 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-foreground">
                Milestone completed and payment released
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                All deliverables were approved. Payout of{" "}
                <strong className="text-foreground font-mono font-bold">
                  ${freelancerPayout.toLocaleString("en-US", { minimumFractionDigits: 2 })} USD
                </strong>{" "}
                has been transferred via Stripe to {freelancerName} (5% platform fee deducted).
              </p>
            </div>
          </div>
        )}

        {milestone.status === "SUBMITTED" && (
          <div className="rounded-xl border border-blue-200/80 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 p-4 flex items-start gap-3">
            <FileCheck className="size-4 shrink-0 text-[#0069D3] mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[#0069D3]">
                Work delivered and awaiting review
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Freelancer submitted deliverables on{" "}
                {formatDateTime(latestSubmission?.submittedAt)}. The client has 7 days to review and approve or request revisions. If no response is received within 7 days, funds are automatically released.
              </p>
            </div>
          </div>
        )}

        {milestone.status === "LATE" && (
          <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 p-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="size-4 shrink-0 text-rose-600 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-rose-600">
                  Milestone overdue (Late)
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  The agreed delivery deadline has passed without a submission.
                  {milestone.paymentStatus === "REFUNDED"
                    ? " Escrow funds were refunded to the client."
                    : milestone.paymentStatus === "FUNDED"
                      ? " As client, you may request an automatic escrow refund or contact the freelancer."
                      : ""}
                </p>
              </div>
            </div>
            {isClient &&
              milestone.paymentStatus === "FUNDED" &&
              canRefundPermission &&
              onRefund && (
                <Button
                  size="sm"
                  onClick={onRefund}
                  className="h-8 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold px-3.5 shrink-0 cursor-pointer"
                >
                  <RotateCcw className="mr-1 size-3" />
                  Refund Escrow
                </Button>
              )}
          </div>
        )}

        {milestone.status === "CHANGES_REQUESTED" && (
          <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 p-4 flex items-start gap-3">
            <RotateCcw className="size-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="text-xs font-bold text-amber-600">
                Revisions requested by client
              </h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                The client requested modifications. Please review the revision notes below and upload the updated deliverables when ready.
              </p>
            </div>
          </div>
        )}

        {milestone.status === "IN_PROGRESS" && (
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Clock className="size-4 shrink-0 text-[#0069D3] mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-foreground">
                  Work in progress
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Milestone is actively underway. Escrow funds of{" "}
                  <strong className="font-mono text-foreground">
                    ${amountNumber.toFixed(2)} USD
                  </strong>{" "}
                  are securely held in Frevia escrow protection.
                </p>
              </div>
            </div>
            {isFreelancer && canSubmitWorkPermission && onSubmitWork && (
              <Button
                size="sm"
                onClick={onSubmitWork}
                className="h-8 rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold px-4 shrink-0 cursor-pointer"
              >
                <Upload className="mr-1.5 size-3.5" />
                Deliver Work
              </Button>
            )}
          </div>
        )}

        {milestone.status === "PENDING" && milestone.paymentStatus === "FUNDED" && (
          <div className="rounded-xl border border-emerald-200/60 dark:border-emerald-900/40 bg-emerald-50/30 dark:bg-emerald-950/20 p-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="size-4 shrink-0 text-emerald-600 mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-emerald-600">
                  Escrow funded & ready to start
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Deposit of{" "}
                  <strong className="font-mono text-foreground">
                    ${amountNumber.toFixed(2)} USD
                  </strong>{" "}
                  is safely held in escrow. Freelancer can begin working on agreed deliverables.
                </p>
              </div>
            </div>
            {isFreelancer && canStartWorkPermission && onStartWork && (
              <Button
                size="sm"
                onClick={onStartWork}
                className="h-8 rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold px-4 shrink-0 cursor-pointer"
              >
                <Play className="mr-1.5 size-3.5" />
                Start Work
              </Button>
            )}
          </div>
        )}

        {milestone.status === "PENDING" && milestone.paymentStatus === "PENDING" && (
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <Lock className="size-4 shrink-0 text-muted-foreground mt-0.5" />
              <div className="space-y-0.5">
                <h4 className="text-xs font-bold text-foreground">
                  Awaiting escrow deposit
                </h4>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Client must deposit the milestone funds into escrow before the freelancer begins work.
                </p>
              </div>
            </div>
            {isClient && canFundPermission && onFund && (
              <Button
                size="sm"
                onClick={onFund}
                className="h-8 rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold px-4 shrink-0 cursor-pointer"
              >
                <CreditCard className="mr-1.5 size-3.5" />
                Fund Escrow
              </Button>
            )}
          </div>
        )}

        {/* ── 2. Fiverr-Style Deliverables Section (Clean & Borderless) ── */}
        {latestSubmission ? (
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="flex items-center gap-2">
                <FileCheck className="size-4 text-[#0069D3]" />
                <h3 className="text-sm font-bold text-foreground">
                  Latest Deliverable Submission
                </h3>
              </div>
              <span className="text-xs text-muted-foreground font-mono">
                {formatDateTime(latestSubmission.submittedAt)}
              </span>
            </div>

            {/* Freelancer message */}
            {latestSubmission.message && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-muted-foreground">
                  Message from {freelancerName}:
                </span>
                <p className="text-xs sm:text-sm text-foreground leading-relaxed whitespace-pre-wrap bg-muted/20 p-3.5 rounded-xl border border-border/40">
                  {latestSubmission.message}
                </p>
              </div>
            )}

            {/* Attached Deliverable Files */}
            {latestSubmission.files && latestSubmission.files.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Deliverable Files:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {latestSubmission.files.map((item) => (
                    <div
                      key={item.fileId}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-border/60 bg-background hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="size-4 text-[#0069D3] shrink-0" />
                        <span className="text-xs font-medium text-foreground truncate max-w-[180px]">
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
                          <Download className="size-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* External Links */}
            {latestSubmission.links && latestSubmission.links.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-semibold text-muted-foreground">
                  Project Links:
                </span>
                <div className="flex flex-wrap gap-2">
                  {latestSubmission.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-muted/20 px-3 py-1.5 text-xs text-[#0069D3] hover:underline"
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
              <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 p-4 text-xs space-y-1.5 bg-amber-50/40 dark:bg-amber-950/20">
                <div className="flex items-center gap-1.5 text-amber-700 dark:text-amber-400 font-bold">
                  <RotateCcw className="size-3.5" />
                  <span>Revisions Requested by {clientName}:</span>
                </div>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap pl-5">
                  {latestSubmission.changeRequestMessage}
                </p>
                {latestSubmission.changeRequestDueDate && (
                  <span className="block pt-1 pl-5 text-[11px] text-amber-600 dark:text-amber-400">
                    Target revision date: {formatDate(latestSubmission.changeRequestDueDate)}
                  </span>
                )}
              </div>
            )}

            {/* Direct Contextual Actions Bar right under deliverables */}
            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-border/40">
              {/* Client Review & Approval Buttons */}
              {isClient && milestone.status === "SUBMITTED" && canReviewPermission && onReviewSubmission && (
                <>
                  <Button
                    onClick={() => onReviewSubmission(latestSubmission)}
                    className="h-9 rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold px-5 shadow-2xs cursor-pointer"
                  >
                    <Check className="mr-1.5 size-3.5" />
                    Review & Approve Delivery
                  </Button>
                </>
              )}

              {/* Freelancer Resubmit Button */}
              {isFreelancer &&
                milestone.status === "CHANGES_REQUESTED" &&
                canSubmitWorkPermission &&
                onSubmitWork && (
                  <Button
                    onClick={onSubmitWork}
                    className="h-9 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-5 shadow-2xs cursor-pointer"
                  >
                    <RotateCcw className="mr-1.5 size-3.5" />
                    Resubmit Updated Work
                  </Button>
                )}

              {/* Client Release Button if milestone completed & funded */}
              {isClient &&
                milestone.status === "COMPLETED" &&
                milestone.paymentStatus === "FUNDED" &&
                canReleasePermission &&
                onRelease && (
                  <Button
                    onClick={onRelease}
                    className="h-9 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-5 shadow-2xs cursor-pointer"
                  >
                    <Check className="mr-1.5 size-3.5" />
                    Release Payment Payout
                  </Button>
                )}
            </div>
          </div>
        ) : (
          /* Empty Deliverables State (When work has not been submitted yet) */
          <div className="py-8 text-center space-y-2 border-b border-border/40">
            <Clock className="size-6 mx-auto text-muted-foreground/60" />
            <h4 className="text-xs font-semibold text-foreground">
              No deliverables submitted yet
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {isFreelancer
                ? "Once you complete the work for this milestone, click 'Deliver Work' to upload files and notes."
                : "The freelancer will submit files and links here for your review and approval."}
            </p>
            {isFreelancer &&
              (milestone.status === "IN_PROGRESS" || milestone.status === "LATE") &&
              canSubmitWorkPermission &&
              onSubmitWork && (
                <Button
                  size="sm"
                  onClick={onSubmitWork}
                  className="rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold px-4 mt-2 cursor-pointer"
                >
                  <Upload className="mr-1.5 size-3.5" />
                  Deliver Work Now
                </Button>
              )}
          </div>
        )}

        {/* ── 3. Scope & Requirements Section (Clean typography, no box wrapper) ── */}
        <div className="space-y-3 pt-4 border-t border-border/40">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground">
              Scope of Deliverables
            </h3>
            <span className="font-mono text-xs font-medium text-muted-foreground">
              Budget: ${amountNumber.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap">
            {milestone.description || (
              <span className="text-muted-foreground italic">
                No detailed scope description specified for this milestone. Work follows overall contract terms.
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ── Right Column: Milestone Summary & Counterparty (4 Cols) ── */}
      <div className="lg:col-span-4 space-y-6 lg:pl-4 lg:border-l lg:border-border/50">
        {/* Financial Summary */}
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Milestone Financials
          </span>
          <div className="space-y-2 pt-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Milestone Price:</span>
              <span className="font-mono font-bold text-foreground text-sm">
                ${amountNumber.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Freelancer Fee (5%):</span>
              <span className="font-mono text-muted-foreground">
                -${freelancerFee.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border/40">
              <span className="font-medium text-foreground">Freelancer Payout (95%):</span>
              <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                ${freelancerPayout.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Schedule & Timeline Summary */}
        <div className="space-y-3 pt-4 border-t border-border/50">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Timeline
          </span>
          <div className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Target Deadline:</span>
              <span className="font-mono font-medium text-foreground">
                {formatDate(milestone.dueDate)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Time Status:</span>
              <span className="font-medium text-foreground">
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
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {formatDate(milestone.completedAt)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Participants (Client & Freelancer) */}
        <div className="space-y-3 pt-4 border-t border-border/50">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            Contract Participants
          </span>
          <div className="space-y-2.5">
            {/* Client */}
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">
                <User className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-foreground block truncate">
                  {clientName}
                </span>
                <span className="text-[11px] text-muted-foreground block">
                  Client
                </span>
              </div>
            </div>

            {/* Freelancer */}
            <div className="flex items-center gap-2.5">
              <div className="flex size-7 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">
                <User className="size-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-xs font-semibold text-foreground block truncate">
                  {freelancerName}
                </span>
                <span className="text-[11px] text-muted-foreground block">
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
            <div className="pt-4 border-t border-border/50">
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
