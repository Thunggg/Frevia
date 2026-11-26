"use client";

import Link from "next/link";
import { useFormatter, useTranslations } from "next-intl";
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
  contractExpiresAt?: string | Date | null;
  isHeldInContract?: boolean;
  milestone: MilestoneType;
  index: number;
  totalMilestones?: number;
  isFreelancer?: boolean;
  basePath?: string;
  startWorkBlockedReason?: string | null;
  onEdit?: (milestone: MilestoneType) => void;
  onDelete?: (milestone: MilestoneType) => void;
  onFund?: (milestone: MilestoneType) => void;
  onRelease?: (milestone: MilestoneType) => void;
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
  contractExpiresAt,
  isHeldInContract = false,
  milestone,
  index,
  totalMilestones = 1,
  isFreelancer = false,
  basePath = "/client",
  startWorkBlockedReason = null,
  onEdit,
  onDelete,
  onFund,
  onRelease,
  onReview,
  onSubmitWork,
  onStartWork,
  onOpenDispute,
  onViewDispute,
}: MilestoneCardProps) {
  const format = useFormatter();
  const t = useTranslations("milestoneWorkspace.card");
  const tPaymentStatus = useTranslations("paymentStatus");
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

  const slugParam = contractSlug || String(contractId);
  const detailUrl = `${basePath}/contracts/${slugParam}/milestones/${milestone.id}`;
  const milestoneCode = `MLS-${String(milestone.id).padStart(4, "0")}`;

  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return t("notSpecified");
    const d = new Date(date);
    return format.dateTime(d, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const isContractExpired = Boolean(
    contractExpiresAt && new Date(contractExpiresAt).getTime() < Date.now(),
  );

  const isOverdue =
    milestone.dueDate &&
    milestone.status !== "COMPLETED" &&
    milestone.status !== "LATE" &&
    new Date(milestone.dueDate).getTime() < new Date().getTime();

  const getDueCountdown = () => {
    if (milestone.status === "COMPLETED") return t("completed");
    if (!milestone.dueDate) return null;
    const now = new Date().getTime();
    const target = new Date(milestone.dueDate).getTime();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0 || milestone.status === "LATE") {
      const overdueDays = Math.abs(diffDays);
      return t("daysOverdue", { count: overdueDays });
    }
    if (diffDays === 0) return t("dueToday");
    return t("daysLeft", { count: diffDays });
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

  // Status indicator: clean text & icon without colored background
  const renderWorkStatusText = () => {
    switch (milestone.status) {
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="size-3.5" />
            <span>{t("statusCompleted")}</span>
          </span>
        );
      case "SUBMITTED":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#0069D3] dark:text-blue-400">
            <FileCheck className="size-3.5" />
            <span>{t("statusSubmitted")}</span>
          </span>
        );
      case "IN_PROGRESS":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 dark:text-sky-400">
            <span className="size-1.5 rounded-full bg-sky-500 animate-pulse" />
            <span>{t("statusInProgress")}</span>
          </span>
        );
      case "CHANGES_REQUESTED":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
            <RotateCcw className="size-3.5" />
            <span>{t("statusChangesRequested")}</span>
          </span>
        );
      case "LATE":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
            <AlertTriangle className="size-3.5" />
            <span>{t("statusLate")}</span>
          </span>
        );
      case "DISPUTED":
        return (
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 dark:text-rose-400">
            <Scale className="size-3.5" />
            <span>{t("statusDisputed")}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="size-3.5" />
            <span>{t("statusPending")}</span>
          </span>
        );
    }
  };

  // Payment status indicator with full lifecycle coverage (PENDING, FUNDED, RELEASED, REFUNDED, DISPUTED)
  const renderEscrowStatusText = () => {
    const paymentStatus = milestone.paymentStatus || "PENDING";
    const statusLabel = tPaymentStatus(paymentStatus);
    const tooltipText = t("paymentStatusLabel", { status: statusLabel });

    switch (paymentStatus) {
      case "FUNDED":
        return (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400"
            title={tooltipText}
          >
            <ShieldCheck className="size-3" />
            <span>{statusLabel}</span>
          </span>
        );
      case "RELEASED":
        return (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400"
            title={tooltipText}
          >
            <Check className="size-3" />
            <span>{statusLabel}</span>
          </span>
        );
      case "REFUNDED":
        return (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-500 dark:text-zinc-400"
            title={tooltipText}
          >
            <RotateCcw className="size-3" />
            <span>{statusLabel}</span>
          </span>
        );
      case "DISPUTED":
        return (
          <span
            className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400"
            title={tooltipText}
          >
            <Scale className="size-3" />
            <span>{statusLabel}</span>
          </span>
        );
      case "PENDING":
      default:
        return (
          <span
            className="inline-flex items-center gap-1 text-[11px] text-muted-foreground"
            title={tooltipText}
          >
            <Lock className="size-3" />
            <span>{statusLabel}</span>
          </span>
        );
    }
  };

  const isCompleted = milestone.status === "COMPLETED";
  const stepNumber = String(index + 1).padStart(2, "0");
  const countdownText = getDueCountdown();
  const isLastMilestone = index === totalMilestones - 1;

  return (
    <div className="relative py-4 sm:py-5">
      {/* Connecting vertical timeline line */}
      {!isLastMilestone && (
        <div className="absolute left-[13px] sm:left-[15px] top-11 bottom-0 w-[1px] bg-border/50 -z-0" />
      )}

      <div className="relative z-10 flex flex-col md:flex-row md:items-start justify-between gap-3">
        {/* Left Side: Subtle step indicator + Title & Description + Badges */}
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {/* Minimal Step Indicator (No heavy colored bg) */}
          <div className="flex size-7 sm:size-8 shrink-0 items-center justify-center rounded-full border border-border text-[11px] font-mono text-muted-foreground bg-background">
            {isCompleted ? <Check className="size-3.5 text-emerald-600" /> : stepNumber}
          </div>

          {/* Details */}
          <div className="space-y-1 flex-1 min-w-0">
            {/* Title & Code */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] text-muted-foreground">
                {milestoneCode}
              </span>
              <span className="text-border">•</span>
              {canViewDetail ? (
                <Link
                  href={detailUrl}
                  className="font-medium text-sm sm:text-base text-foreground hover:text-[#0069D3] transition-colors line-clamp-1"
                >
                  {milestone.title}
                </Link>
              ) : (
                <span className="font-medium text-sm sm:text-base text-foreground line-clamp-1">
                  {milestone.title}
                </span>
              )}
            </div>

            {/* Scope / Description */}
            {milestone.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed max-w-2xl">
                {milestone.description}
              </p>
            )}

            {/* Badges & Due Date Row (Text only, no colored bg) */}
            <div className="flex flex-wrap items-center gap-2.5 pt-0.5 text-xs">
              {renderWorkStatusText()}
              <span className="text-border">•</span>
              {renderEscrowStatusText()}
              {milestone.dueDate && (
                <>
                  <span className="text-border">•</span>
                  <span
                    className={`inline-flex items-center gap-1 font-mono text-[11px] ${isOverdue || milestone.status === "LATE"
                      ? "text-rose-600 dark:text-rose-400 font-medium"
                      : "text-muted-foreground"
                      }`}
                  >
                    <Clock className="size-3" />
                    <span>{t("duePrefix", { date: formatDate(milestone.dueDate) })}</span>
                    {countdownText && (
                      <span className="font-sans opacity-75">
                        ({countdownText})
                      </span>
                    )}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Side: Price & Actions */}
        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-2 shrink-0 pt-2 md:pt-0 pl-10 md:pl-0 border-t sm:border-t-0 border-border/30">
          {/* Price */}
          <div className="text-left sm:text-right">
            <span className="font-mono text-sm sm:text-base font-semibold text-foreground block leading-tight">
              ${Number(milestone.amount).toLocaleString("en-US", {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>

          {/* Action Buttons Row */}
          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            {/* Client: Fund Escrow */}
            {canFundMilestone && canFundPermission && onFund && (
              <Button
                size="sm"
                onClick={() => onFund(milestone)}
                className="h-7 rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-normal px-3 cursor-pointer"
              >
                <CreditCard className="mr-1 size-3" />
                {t("fundEscrow")}
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
                  className="h-7 rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-normal px-3 cursor-pointer"
                >
                  <FileCheck className="mr-1 size-3" />
                  {t("reviewDelivery")}
                </Button>
              )}

            {/* Client: Release Payment */}
            {canReleaseMilestone && canReleasePermission && onRelease && (
              <Button
                size="sm"
                onClick={() => onRelease(milestone)}
                className="h-7 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-normal px-3 cursor-pointer"
              >
                <Check className="mr-1 size-3" />
                {t("releasePayment")}
              </Button>
            )}

            {/* Freelancer: Start Work */}
            {isFreelancer &&
              (milestone.status === "PENDING" || milestone.status === "LATE") &&
              milestone.paymentStatus === "FUNDED" &&
              canProgressPermission &&
              onStartWork && (
                <Button
                  size="sm"
                  disabled={Boolean(startWorkBlockedReason)}
                  title={startWorkBlockedReason ?? undefined}
                  onClick={() => onStartWork(milestone)}
                  className="h-7 rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-normal px-3 cursor-pointer disabled:opacity-50"
                >
                  {startWorkBlockedReason ? (
                    <Lock className="mr-1 size-3" />
                  ) : (
                    <Play className="mr-1 size-3" />
                  )}
                  {t("startWork")}
                </Button>
              )}

            {/* Freelancer: Deliver Work */}
            {isFreelancer &&
              (milestone.status === "IN_PROGRESS" || milestone.status === "LATE") &&
              canSubmitPermission &&
              onSubmitWork &&
              !isContractExpired && (
                <Button
                  size="sm"
                  onClick={() => onSubmitWork(milestone)}
                  className="h-7 rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-normal px-3 cursor-pointer"
                >
                  <Upload className="mr-1 size-3" />
                  {milestone.status === "LATE"
                    ? t("deliverWorkLate")
                    : t("deliverWork")}
                </Button>
              )}

            {/* Freelancer: Resubmit Work */}
            {isFreelancer &&
              milestone.status === "CHANGES_REQUESTED" &&
              canSubmitPermission &&
              onSubmitWork &&
              !isContractExpired && (
                <Button
                  size="sm"
                  onClick={() => onSubmitWork(milestone)}
                  className="h-7 rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-normal px-3 cursor-pointer"
                >
                  <RotateCcw className="mr-1 size-3" />
                  {t("resubmitWork")}
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
                  className="h-7 rounded-full border-rose-200 dark:border-rose-800 text-rose-600 hover:bg-rose-50 text-xs font-normal px-2.5 cursor-pointer"
                >
                  <Scale className="mr-1 size-3" />
                  {t("dispute")}
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
                  className="h-7 text-xs text-muted-foreground hover:text-rose-600 px-1.5 cursor-pointer"
                  title={t("disputeTooltip")}
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
                className="h-7 text-xs text-muted-foreground hover:text-[#0069D3] px-1.5 cursor-pointer"
                title={t("editTooltip")}
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
                className="h-7 text-xs text-muted-foreground hover:text-rose-600 px-1.5 cursor-pointer"
                title={t("deleteTooltip")}
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}

            {/* View Details link */}
            {canViewDetail && (
              <Button
                asChild
                variant="ghost"
                size="sm"
                className="h-7 text-xs font-normal text-muted-foreground hover:text-[#0069D3] px-2 cursor-pointer"
              >
                <Link href={detailUrl} className="inline-flex items-center gap-1">
                  <span>{t("details")}</span>
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
