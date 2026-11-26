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
  startWorkBlockedReason?: string | null;
  onOpenDispute?: () => void;
  onViewDispute?: () => void;
  onFund?: () => void;
  onStartWork?: () => void;
  onSubmitWork?: () => void;
  onReviewSubmission?: (submission?: GetSubmissionResponseType) => void;
  onRelease?: () => void;
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
}: MilestoneOverviewTabProps) {
  const format = useFormatter();
  const t = useTranslations("milestoneWorkspace.overview");
  const tCard = useTranslations("milestoneWorkspace.card");
  const tPaymentStatus = useTranslations("paymentStatus");
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
  const canStartWorkPermission = can("PATCH", "/api/contracts/:contractId/milestones/:id/progress");
  const canSubmitWorkPermission = can("POST", "/api/contracts/:contractId/milestones/:milestoneId/submissions");
  const canApprovePermission = can("PATCH", "/api/contracts/:contractId/milestones/:milestoneId/submissions/:id/approve");
  const canRequestChangesPermission = can("PATCH", "/api/contracts/:contractId/milestones/:milestoneId/submissions/:id/request-changes");
  const canReviewPermission = canApprovePermission || canRequestChangesPermission;

  const latestSubmission = submissions.length > 0 ? submissions[0] : null;

  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return tCard("notSpecified");
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
        return tCard("daysTotal", { count: days });
      }
      return tCard("completed");
    }

    if (!milestone.dueDate) return tCard("noDeadline");
    const now = new Date().getTime();
    const target = new Date(milestone.dueDate).getTime();
    const diffDays = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

    if (diffDays < 0 || milestone.status === "LATE") {
      const overdue = Math.abs(diffDays);
      return tCard("daysOverdue", { count: overdue });
    }
    if (diffDays === 0) return tCard("dueToday");
    return tCard("daysLeft", { count: diffDays });
  };

  const amountNumber = Number(milestone.amount) || 0;
  const freelancerFee = Math.round(amountNumber * 0.05 * 100) / 100;
  const freelancerPayout = Math.round((amountNumber - freelancerFee) * 100) / 100;

  const renderPaymentStatusBadge = () => {
    const paymentStatus = milestone.paymentStatus || "PENDING";
    switch (paymentStatus) {
      case "FUNDED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <ShieldCheck className="size-3" />
            <span>{tPaymentStatus("FUNDED")}</span>
          </span>
        );
      case "RELEASED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400">
            <Check className="size-3" />
            <span>{tPaymentStatus("RELEASED")}</span>
          </span>
        );
      case "REFUNDED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
            <RotateCcw className="size-3" />
            <span>{tPaymentStatus("REFUNDED")}</span>
          </span>
        );
      case "DISPUTED":
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 dark:text-rose-400">
            <Scale className="size-3" />
            <span>{tPaymentStatus("DISPUTED")}</span>
          </span>
        );
      case "PENDING":
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
            <Lock className="size-3" />
            <span>{tPaymentStatus("PENDING")}</span>
          </span>
        );
    }
  };

  const clientName =
    contract.client?.profile?.displayName ||
    contract.client?.email?.split("@")[0] ||
    t("clientRole");

  const freelancerName =
    contract.freelancer?.profile?.displayName ||
    contract.freelancer?.email?.split("@")[0] ||
    t("freelancerRole");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-1">
      {/* ── Left Column: Main Deliverables & Workflow Workspace (8 Cols) ── */}
      <div className="lg:col-span-8 space-y-5">
        {/* ── Status Guidance Notice (Clean line, NO colored background boxes) ── */}
        {milestone.status === "DISPUTED" && (
          <div className="flex items-start justify-between gap-3 border-l-2 border-rose-500 pl-3 py-1 text-xs">
            <div className="space-y-0.5">
              <span className="font-medium text-rose-600 block">
                {t("disputedTitle")}
              </span>
              <p className="text-muted-foreground leading-relaxed">
                {t("disputedDesc")}
              </p>
            </div>
            {canViewDispute && onViewDispute && (
              <Button
                variant="outline"
                size="sm"
                onClick={onViewDispute}
                className="h-7 text-xs text-rose-600 shrink-0 cursor-pointer"
              >
                {t("viewDispute")}
              </Button>
            )}
          </div>
        )}

        {milestone.status === "COMPLETED" && (
          <div className="flex items-start gap-2.5 border-l-2 border-emerald-500 pl-3 py-1 text-xs">
            <CheckCircle2 className="size-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-medium text-foreground block">
                {t("completedTitle")}
              </span>
              <p className="text-muted-foreground leading-relaxed">
                {t("completedDesc", {
                  amount: `$${freelancerPayout.toFixed(2)}`,
                  name: freelancerName,
                })}
              </p>
            </div>
          </div>
        )}

        {milestone.status === "SUBMITTED" && (
          <div className="flex items-start gap-2.5 border-l-2 border-[#0069D3] pl-3 py-1 text-xs">
            <FileCheck className="size-4 text-[#0069D3] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-medium text-foreground block">
                {t("submittedTitle")}
              </span>
              <p className="text-muted-foreground leading-relaxed">
                {t("submittedDesc", {
                  date: formatDateTime(latestSubmission?.submittedAt),
                })}
              </p>
            </div>
          </div>
        )}

        {milestone.status === "LATE" && (
          <div className="flex items-start justify-between gap-3 border-l-2 border-rose-500 pl-3 py-1 text-xs">
            <div className="space-y-0.5">
              <span className="font-medium text-rose-600 block">
                {t("lateTitle")}
              </span>
              <p className="text-muted-foreground leading-relaxed">
                {t("lateDesc")}
                {milestone.paymentStatus === "FUNDED" && isClient
                  ? t("lateClientExtra")
                  : ""}
              </p>
            </div>
          </div>
        )}

        {milestone.status === "CHANGES_REQUESTED" && (
          <div className="flex items-start gap-2.5 border-l-2 border-amber-500 pl-3 py-1 text-xs">
            <RotateCcw className="size-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-medium text-amber-600 block">
                {t("changesTitle")}
              </span>
              <p className="text-muted-foreground leading-relaxed">
                {t("changesDesc")}
              </p>
            </div>
          </div>
        )}

        {milestone.status === "IN_PROGRESS" && (
          <div className="flex items-start justify-between gap-3 border-l-2 border-border pl-3 py-1 text-xs">
            <div className="space-y-0.5">
              <span className="font-medium text-foreground block">
                {t("inProgressTitle")}
              </span>
              <p className="text-muted-foreground leading-relaxed">
                {t("inProgressDesc", { amount: `$${amountNumber.toFixed(2)}` })}
              </p>
            </div>
            {isFreelancer && canSubmitWorkPermission && onSubmitWork && (
              <Button
                size="sm"
                onClick={onSubmitWork}
                className="h-7 rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-normal px-3 shrink-0 cursor-pointer"
              >
                <Upload className="mr-1 size-3" />
                {tCard("deliverWork")}
              </Button>
            )}
          </div>
        )}

        {milestone.status === "PENDING" && milestone.paymentStatus === "FUNDED" && (
          <div className="flex items-start justify-between gap-3 border-l-2 border-emerald-500 pl-3 py-1 text-xs">
            <div className="space-y-0.5">
              <span className="font-medium text-emerald-600 block">
                {isFreelancer && startWorkBlockedReason
                  ? t("lockedTitle")
                  : t("readyTitle")}
              </span>
              <p className="text-muted-foreground leading-relaxed">
                {isFreelancer && startWorkBlockedReason
                  ? t("lockedDesc", { reason: startWorkBlockedReason })
                  : t("readyDesc", { amount: `$${amountNumber.toFixed(2)}` })}
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
                {tCard("startWork")}
              </Button>
            )}
          </div>
        )}

        {milestone.status === "PENDING" && milestone.paymentStatus === "PENDING" && (
          <div className="flex items-start justify-between gap-3 border-l-2 border-border pl-3 py-1 text-xs">
            <div className="space-y-0.5">
              <span className="font-medium text-foreground block">
                {t("awaitingTitle")}
              </span>
              <p className="text-muted-foreground leading-relaxed">
                {t("awaitingDesc")}
              </p>
            </div>
            {isClient && canFundPermission && onFund && (
              <Button
                size="sm"
                onClick={onFund}
                className="h-7 rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-normal px-3 shrink-0 cursor-pointer"
              >
                <CreditCard className="mr-1 size-3" />
                {tCard("fundEscrow")}
              </Button>
            )}
          </div>
        )}

        {/* ── Deliverables Section ── */}
        {latestSubmission ? (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between pb-1.5 border-b border-border/40">
              <h3 className="text-xs font-semibold text-foreground">
                {t("latestDeliverable")}
              </h3>
              <span className="text-[11px] text-muted-foreground font-mono">
                {formatDateTime(latestSubmission.submittedAt)}
              </span>
            </div>

            {/* Freelancer message */}
            {latestSubmission.message && (
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">
                  {t("notesFrom", { name: freelancerName })}
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
                  {t("deliverableFiles")}
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
                          {item.file?.fileName ||
                            t("deliverableFileFallback", { id: item.fileId })}
                        </span>
                      </div>
                      {item.file?.fileUrl && (
                        <a
                          href={item.file.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          download
                          className="p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
                          title={t("downloadFile")}
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
                  {t("projectLinks")}
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
                  {t("revisionsRequestedBy", { name: clientName })}
                </span>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {latestSubmission.changeRequestMessage}
                </p>
                {latestSubmission.changeRequestDueDate && (
                  <span className="block text-[11px] text-muted-foreground">
                    {t("targetRevisionDate", {
                      date: formatDate(latestSubmission.changeRequestDueDate),
                    })}
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
                  {t("reviewApproveDelivery")}
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
                    {t("resubmitUpdatedWork")}
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
                    {tCard("releasePayment")}
                  </Button>
                )}
            </div>
          </div>
        ) : (
          /* Empty Deliverables State */
          <div className="py-6 text-center space-y-1.5 border-b border-border/40">
            <Clock className="size-5 mx-auto text-muted-foreground/60" />
            <h4 className="text-xs font-medium text-foreground">
              {t("noDeliverablesTitle")}
            </h4>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              {isFreelancer
                ? t("noDeliverablesFreelancer")
                : t("noDeliverablesClient")}
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
                  {t("deliverWorkNow")}
                </Button>
              )}
          </div>
        )}

        {/* ── Scope & Requirements ── */}
        <div className="space-y-2 pt-3 border-t border-border/40">
          <h3 className="text-xs font-semibold text-foreground">
            {t("scopeTitle")}
          </h3>
          <div className="text-xs text-foreground/80 leading-relaxed whitespace-pre-wrap">
            {milestone.description || (
              <span className="text-muted-foreground italic">
                {t("noScope")}
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
            {t("financialsTitle")}
          </span>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("budget")}</span>
              <span className="font-mono font-medium text-foreground">
                ${amountNumber.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("paymentStatusLabel")}</span>
              {renderPaymentStatusBadge()}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("freelancerFee")}</span>
              <span className="font-mono text-muted-foreground">
                -${freelancerFee.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border/30">
              <span className="text-foreground">{t("freelancerNet")}</span>
              <span className="font-mono font-medium text-emerald-600 dark:text-emerald-400">
                ${freelancerPayout.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {/* Schedule & Timeline Summary */}
        <div className="space-y-2.5 pt-3 border-t border-border/40">
          <span className="text-xs font-medium text-muted-foreground">
            {t("timelineTitle")}
          </span>
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("targetDeadline")}</span>
              <span className="font-mono text-foreground">
                {formatDate(milestone.dueDate)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("timeStatus")}</span>
              <span className="text-foreground">
                {getDurationOrDaysRemaining()}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">{t("created")}</span>
              <span className="text-muted-foreground">
                {formatDate(milestone.createdAt)}
              </span>
            </div>
            {milestone.completedAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t("completedLabel")}
                </span>
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
            {t("participantsTitle")}
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
                  {t("clientRole")}
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
                  {t("freelancerRole")}
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
                {t("openDisputeCta")}
              </Button>
            </div>
          )}
      </div>
    </div>
  );
}
