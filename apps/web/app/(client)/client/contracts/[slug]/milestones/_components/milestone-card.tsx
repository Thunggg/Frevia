"use client";

import Link from "next/link";
import { useFormatter } from "next-intl";
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  CreditCard,
  Edit2,
  FileCheck,
  Lock,
  Play,
  RotateCcw,
  Scale,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";
import { useActionPermission } from "@/hooks/use-action-permission";
import type { MilestoneType } from "@shared/types";

export interface MilestoneCardProps {
  contractId: number;
  contractSlug?: string;
  contractStatus?: string;
  isHeldInContract?: boolean;
  milestone: MilestoneType;
  index: number;
  totalMilestones?: number;
  isFreelancer?: boolean;
  basePath?: string;
  hasOtherInProgressMilestone?: boolean;
  variant?: "table-row" | "card" | "list-item";
  onEdit?: (milestone: MilestoneType) => void;
  onDelete?: (milestone: MilestoneType) => void;
  onFund?: (milestone: MilestoneType) => void;
  onRelease?: (milestone: MilestoneType) => void;
  onRefund?: (milestone: MilestoneType) => void;
  onReview?: (milestone: MilestoneType) => void;
  onSubmitWork?: (milestone: MilestoneType) => void;
  onStartWork?: (milestone: MilestoneType) => void;
  onOpenDispute?: (milestone: MilestoneType) => void;
  onViewDispute?: (milestone: MilestoneType) => void;
}

export function MilestoneCard({
  contractId,
  contractSlug,
  contractStatus,
  isHeldInContract = false,
  milestone,
  index,
  totalMilestones = 1,
  isFreelancer = false,
  basePath = "/client",
  hasOtherInProgressMilestone = false,
  onEdit,
  onDelete,
  onFund,
  onRelease,
  onRefund,
  onReview,
  onSubmitWork,
  onStartWork,
  onOpenDispute,
  onViewDispute,
}: MilestoneCardProps) {
  const format = useFormatter();
  const { can, canAny } = useActionPermission();

  const canViewDetail = can("GET", "/api/contracts/:contractId/milestones/:id");
  const canEditPermission = can("PATCH", "/api/contracts/:contractId/milestones/:id");
  const canDeletePermission = can("DELETE", "/api/contracts/:contractId/milestones/:id");
  const canProgressPermission = can("PATCH", "/api/contracts/:contractId/milestones/:id/progress");
  const canSubmitPermission = can("POST", "/api/contracts/:contractId/milestones/:milestoneId/submissions");
  const canApprovePermission = can("PATCH", "/api/contracts/:contractId/milestones/:milestoneId/submissions/:id/approve");
  const canRequestChangesPermission = can("PATCH", "/api/contracts/:contractId/milestones/:milestoneId/submissions/:id/request-changes");
  const canReviewPermission = canApprovePermission || canRequestChangesPermission;

  const canCreateDisputePermission = can("POST", "/api/disputes");
  const canViewDisputePermission = can("GET", "/api/disputes/milestone/:milestoneId");

  const canFundPermission = canAny([
    { method: "POST", path: "/api/payments/contracts/:contractId/milestones/:milestoneId/fund/intent" },
    { method: "POST", path: "/api/payments/contracts/:contractId/milestones/:milestoneId/fund/checkout-session" },
    { method: "POST", path: "/api/payments/contracts/:contractId/milestones/:milestoneId/fund/saved-card" },
  ]);
  const canReleasePermission = can("POST", "/api/payments/contracts/:contractId/milestones/:milestoneId/release");
  const canRefundPermission = can("POST", "/api/payments/contracts/:contractId/milestones/:milestoneId/refund");

  const slugParam = contractSlug || String(contractId);
  const detailUrl = `${basePath}/contracts/${slugParam}/milestones/${milestone.id}`;
  const milestoneCode = `MLS-${String(milestone.id).padStart(4, "0")}`;

  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return "Not specified";
    const d = new Date(date);
    return format.dateTime(d, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isOverdue =
    milestone.dueDate &&
    milestone.status !== "COMPLETED" &&
    milestone.status !== "LATE" &&
    new Date(milestone.dueDate).getTime() < new Date().getTime();

  const getDueCountdown = () => {
    if (milestone.status === "COMPLETED") {
      return "Completed";
    }
    if (!milestone.dueDate) return null;
    const now = new Date().getTime();
    const target = new Date(milestone.dueDate).getTime();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0 || milestone.status === "LATE") {
      const overdueDays = Math.abs(diffDays);
      return `${overdueDays} ${overdueDays === 1 ? "day" : "days"} overdue`;
    }
    if (diffDays === 0) return "Due today";
    return `${diffDays} ${diffDays === 1 ? "day" : "days"} left`;
  };

  const isClient = !isFreelancer;
  const canEdit =
    isClient &&
    (contractStatus === "AWAITING_PAYMENT" ||
      (contractStatus === "PENDING_SIGN" && !isHeldInContract));
  const canFundMilestone =
    isClient &&
    contractStatus === "ACTIVE" &&
    milestone.paymentStatus === "PENDING" &&
    Boolean(onFund);
  const canReleaseMilestone =
    isClient &&
    milestone.status === "COMPLETED" &&
    milestone.paymentStatus === "FUNDED" &&
    Boolean(onRelease);
  const canRefundMilestone =
    isClient &&
    contractStatus === "ACTIVE" &&
    milestone.paymentStatus === "FUNDED" &&
    (milestone.status === "LATE" || milestone.status === "PENDING") &&
    Boolean(onRefund);

  // Accurate Fiverr-style status badges
  const renderWorkStatusBadge = () => {
    switch (milestone.status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 px-2.5 py-0.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3.5" />
            <span>Completed</span>
          </span>
        );
      case "SUBMITTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-500/10 dark:bg-blue-500/20 px-2.5 py-0.5 text-xs font-semibold text-[#0069D3] dark:text-blue-400">
            <FileCheck className="size-3.5" />
            <span>Delivered • In Review</span>
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/10 dark:bg-sky-500/20 px-2.5 py-0.5 text-xs font-semibold text-sky-600 dark:text-sky-400">
            <span className="size-2 rounded-full bg-sky-500 animate-pulse" />
            <span>In Progress</span>
          </span>
        );
      case "CHANGES_REQUESTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 dark:bg-amber-500/20 px-2.5 py-0.5 text-xs font-semibold text-amber-600 dark:text-amber-400">
            <RotateCcw className="size-3.5" />
            <span>Revision Requested</span>
          </span>
        );
      case "LATE":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 dark:bg-rose-500/20 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <AlertTriangle className="size-3.5" />
            <span>Overdue (Late)</span>
          </span>
        );
      case "DISPUTED":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 dark:bg-rose-500/20 px-2.5 py-0.5 text-xs font-semibold text-rose-600 dark:text-rose-400">
            <Scale className="size-3.5" />
            <span>Disputed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 dark:bg-zinc-800 px-2.5 py-0.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
            <Clock className="size-3.5" />
            <span>Draft / Pending</span>
          </span>
        );
    }
  };

  // Accurate Escrow status badge
  const renderEscrowBadge = () => {
    switch (milestone.paymentStatus) {
      case "FUNDED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="size-3.5" />
            <span>Escrow Funded</span>
          </span>
        );
      case "RELEASED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400">
            <Check className="size-3.5" />
            <span>Payment Released</span>
          </span>
        );
      case "REFUNDED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500">
            <RotateCcw className="size-3.5" />
            <span>Refunded</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-400 dark:text-zinc-500">
            <Lock className="size-3.5" />
            <span>Awaiting Deposit</span>
          </span>
        );
    }
  };

  // Step indicator icon & styling
  const isCompleted = milestone.status === "COMPLETED";
  const isInProgress = milestone.status === "IN_PROGRESS";
  const isSubmitted = milestone.status === "SUBMITTED";
  const isWarning = milestone.status === "LATE" || milestone.status === "CHANGES_REQUESTED";

  const stepNumber = String(index + 1).padStart(2, "0");
  const countdownText = getDueCountdown();
  const isLastMilestone = index === totalMilestones - 1;

  return (
    <div className="relative group py-5 sm:py-6 transition-colors hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 px-2 sm:px-4 rounded-xl">
      {/* Connecting vertical timeline line */}
      {!isLastMilestone && (
        <div
          className={`absolute left-6 sm:left-8 top-14 bottom-0 w-[2px] -z-0 ${
            isCompleted
              ? "bg-emerald-500/40"
              : isInProgress || isSubmitted
                ? "bg-[#0069D3]/40"
                : "bg-zinc-200 dark:bg-zinc-800"
          }`}
        />
      )}

      <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-4">
        {/* Left Side: Step Circle + Title & Scope + Badges */}
        <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
          {/* Step Number Badge */}
          <div
            className={`flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all shadow-2xs ${
              isCompleted
                ? "bg-emerald-600 text-white"
                : isSubmitted
                  ? "bg-[#0069D3] text-white"
                  : isInProgress
                    ? "bg-[#0069D3] text-white ring-4 ring-blue-500/20"
                    : isWarning
                      ? "bg-amber-600 text-white"
                      : "bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
            }`}
          >
            {isCompleted ? <Check className="size-4 stroke-[3]" /> : stepNumber}
          </div>

          {/* Details */}
          <div className="space-y-1.5 flex-1 min-w-0">
            {/* Title & Code */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] font-semibold text-zinc-400 dark:text-zinc-500">
                {milestoneCode}
              </span>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              {canViewDetail ? (
                <Link
                  href={detailUrl}
                  className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 hover:text-[#0069D3] transition-colors line-clamp-1"
                >
                  {milestone.title}
                </Link>
              ) : (
                <span className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100 line-clamp-1">
                  {milestone.title}
                </span>
              )}
            </div>

            {/* Scope / Description */}
            {milestone.description && (
              <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed max-w-2xl">
                {milestone.description}
              </p>
            )}

            {/* Badges & Due Date Row */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
              {renderWorkStatusBadge()}
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              {renderEscrowBadge()}
              {milestone.dueDate && (
                <>
                  <span className="text-zinc-300 dark:text-zinc-700">•</span>
                  <span
                    className={`inline-flex items-center gap-1 font-mono text-[11px] ${
                      isOverdue || milestone.status === "LATE"
                        ? "text-rose-600 dark:text-rose-400 font-semibold"
                        : "text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    <Clock className="size-3" />
                    <span>Due: {formatDate(milestone.dueDate)}</span>
                    {countdownText && (
                      <span className="text-[10px] font-medium opacity-80">
                        ({countdownText})
                      </span>
                    )}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Price & Contextual Actions */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 shrink-0 pt-2 md:pt-0 pl-11 md:pl-0 border-t sm:border-t-0 border-zinc-100 dark:border-zinc-800/60">
          {/* Price */}
          <div className="text-left sm:text-right">
            <span className="font-mono text-base sm:text-lg font-extrabold text-zinc-950 dark:text-zinc-50 block leading-tight">
              ${Number(milestone.amount).toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </span>
            <span className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider block">
              Budget
            </span>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {/* Client: Fund Escrow */}
            {canFundMilestone && canFundPermission && onFund && (
              <Button
                size="sm"
                onClick={() => onFund(milestone)}
                className="h-8 rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold px-3.5 shadow-2xs cursor-pointer"
              >
                <CreditCard className="mr-1.5 size-3.5" />
                Fund Escrow
              </Button>
            )}

            {/* Client: Review Delivery */}
            {isClient &&
              milestone.status === "SUBMITTED" &&
              canReviewPermission &&
              onReview && (
                <Button
                  size="sm"
                  onClick={() => onReview(milestone)}
                  className="h-8 rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold px-3.5 shadow-2xs cursor-pointer animate-pulse"
                >
                  <FileCheck className="mr-1.5 size-3.5" />
                  Review Delivery
                </Button>
              )}

            {/* Client: Release Payment */}
            {canReleaseMilestone && canReleasePermission && onRelease && (
              <Button
                size="sm"
                onClick={() => onRelease(milestone)}
                className="h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 shadow-2xs cursor-pointer"
              >
                <Check className="mr-1.5 size-3.5" />
                Release Payment
              </Button>
            )}

            {/* Client: Refund Escrow */}
            {canRefundMilestone && canRefundPermission && onRefund && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onRefund(milestone)}
                className="h-8 rounded-full border-rose-200 dark:border-rose-800 bg-white dark:bg-zinc-900 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-xs font-semibold px-3 cursor-pointer"
              >
                <RotateCcw className="mr-1 size-3" />
                Refund Escrow
              </Button>
            )}

            {/* Freelancer: Start Work */}
            {isFreelancer &&
              milestone.status === "PENDING" &&
              milestone.paymentStatus === "FUNDED" &&
              canProgressPermission &&
              onStartWork && (
                <Button
                  size="sm"
                  disabled={hasOtherInProgressMilestone}
                  onClick={() => onStartWork(milestone)}
                  className="h-8 rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold px-3.5 shadow-2xs cursor-pointer"
                >
                  <Play className="mr-1.5 size-3.5" />
                  Start Work
                </Button>
              )}

            {/* Freelancer: Deliver Work */}
            {isFreelancer &&
              (milestone.status === "IN_PROGRESS" || milestone.status === "LATE") &&
              canSubmitPermission &&
              onSubmitWork && (
                <Button
                  size="sm"
                  onClick={() => onSubmitWork(milestone)}
                  className="h-8 rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold px-3.5 shadow-2xs cursor-pointer"
                >
                  <Upload className="mr-1.5 size-3.5" />
                  {milestone.status === "LATE" ? "Deliver Work (Late)" : "Deliver Work"}
                </Button>
              )}

            {/* Freelancer: Resubmit Work */}
            {isFreelancer &&
              milestone.status === "CHANGES_REQUESTED" &&
              canSubmitPermission &&
              onSubmitWork && (
                <Button
                  size="sm"
                  onClick={() => onSubmitWork(milestone)}
                  className="h-8 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold px-3.5 shadow-2xs cursor-pointer"
                >
                  <RotateCcw className="mr-1.5 size-3.5" />
                  Resubmit Work
                </Button>
              )}

            {/* View Dispute */}
            {milestone.status === "DISPUTED" &&
              canViewDisputePermission &&
              onViewDispute && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onViewDispute(milestone)}
                  className="h-8 rounded-full border-rose-200 dark:border-rose-800 bg-white dark:bg-zinc-900 text-rose-600 hover:bg-rose-50 text-xs font-semibold px-3 cursor-pointer"
                >
                  <Scale className="mr-1 size-3" />
                  Dispute
                </Button>
              )}

            {/* Open Dispute */}
            {milestone.status !== "COMPLETED" &&
              milestone.status !== "DISPUTED" &&
              milestone.paymentStatus === "FUNDED" &&
              canCreateDisputePermission &&
              onOpenDispute && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenDispute(milestone)}
                  className="h-8 text-xs text-zinc-500 hover:text-rose-600 px-2 cursor-pointer"
                  title="Dispute Milestone"
                >
                  <Scale className="size-3.5" />
                </Button>
              )}

            {/* Client: Edit Milestone (when pending sign) */}
            {canEdit && canEditPermission && onEdit && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(milestone)}
                className="h-8 text-xs text-zinc-500 hover:text-[#0069D3] px-2 cursor-pointer"
                title="Edit Milestone"
              >
                <Edit2 className="size-3.5" />
              </Button>
            )}

            {/* Client: Delete Milestone (when pending sign) */}
            {canEdit && canDeletePermission && onDelete && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(milestone)}
                className="h-8 text-xs text-zinc-500 hover:text-rose-600 px-2 cursor-pointer"
                title="Delete Milestone"
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}

            {/* View Details link */}
            {canViewDetail && (
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 rounded-full border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-[#0069D3] hover:border-[#0069D3] text-xs font-medium px-3 cursor-pointer"
              >
                <Link href={detailUrl} className="inline-flex items-center gap-1">
                  <span>Details</span>
                  <ArrowRight className="size-3" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
