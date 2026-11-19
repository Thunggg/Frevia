"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  Check,
  Clock,
  FileText,
  Loader2,
  Scale,
  ShieldAlert,
  Undo2,
  X,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/shadcn/sheet";
import { Button } from "@repo/ui/components/shadcn/button";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { disputeApiRequest } from "@/apiRequests/dispute";
import { useMe } from "@/hooks/use-auth";
import type { DisputeDetailType } from "@shared/types";
import {
  DisputeStatusBadge,
  formatResolutionCurrency,
  getDisputeApiErrorMessage,
  useResolutionHelpers,
} from "./resolution-utils";

interface ResolutionDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  disputeId?: number | null;
  milestoneId?: number | null;
  initialDispute?: DisputeDetailType | null;
  contractId?: number;
}

/**
 * Clean Fiverr-style Resolution Center detail slide-over for Client & Freelancer.
 */
export function ResolutionDetailSheet({
  open,
  onOpenChange,
  disputeId,
  milestoneId,
  initialDispute,
  contractId,
}: ResolutionDetailSheetProps) {
  const t = useTranslations("resolutionCenter.detailSheet");
  const {
    formatDate,
    formatDateTime,
    getTypeLabel,
    getCountdown,
    translateStoredReason,
  } = useResolutionHelpers();
  const queryClient = useQueryClient();
  const { data: me } = useMe();
  const currentUserId = me?.id;

  const [showDeclineForm, setShowDeclineForm] = useState(false);
  const [declineReason, setDeclineReason] = useState("");
  const [showRejectDecisionForm, setShowRejectDecisionForm] = useState(false);
  const [rejectDecisionReason, setRejectDecisionReason] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const { data: dispute, isLoading } = useQuery<DisputeDetailType | null>({
    queryKey: milestoneId
      ? ["milestone-dispute", milestoneId]
      : ["dispute-detail", disputeId],
    queryFn: async () => {
      if (disputeId) {
        const res = await disputeApiRequest.getDisputeDetail(disputeId);
        return res.data;
      }
      if (milestoneId) {
        const res = await disputeApiRequest.getByMilestoneId(milestoneId);
        return res.data;
      }
      return initialDispute ?? null;
    },
    initialData: initialDispute ?? undefined,
    enabled: open && (Boolean(disputeId) || Boolean(milestoneId)),
  });

  const invalidateAll = async (target?: DisputeDetailType | null) => {
    const cId = contractId ?? target?.milestone?.contractId;
    const mId = milestoneId ?? target?.milestoneId;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["my-disputes"] }),
      ...(target?.id
        ? [
            queryClient.invalidateQueries({
              queryKey: ["dispute-detail", target.id],
            }),
          ]
        : []),
      ...(mId
        ? [
            queryClient.invalidateQueries({
              queryKey: ["milestone-dispute", mId],
            }),
          ]
        : []),
      ...(cId
        ? [
            queryClient.invalidateQueries({
              queryKey: ["client-contract-detail", cId],
            }),
            queryClient.invalidateQueries({
              queryKey: ["client-contract-milestones", cId],
            }),
          ]
        : []),
      ...(cId && mId
        ? [
            queryClient.invalidateQueries({
              queryKey: ["milestone-detail", cId, mId],
            }),
          ]
        : []),
      queryClient.invalidateQueries({ queryKey: ["client-transactions"] }),
      queryClient.invalidateQueries({ queryKey: ["freelancer-transactions"] }),
      queryClient.invalidateQueries({ queryKey: ["transactions-summary"] }),
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      queryClient.invalidateQueries({ queryKey: ["contracts-list"] }),
    ]);
  };

  const handleAccept = async () => {
    if (!dispute) return;
    setIsBusy(true);
    try {
      const res = await disputeApiRequest.respondToDispute(dispute.id, {
        action: "ACCEPT",
      });
      await invalidateAll(res.data);
      toastSuccess({
        message:
          dispute.resolutionType === "EXTEND_DEADLINE"
            ? t("acceptExtendSuccess")
            : t("acceptSettleSuccess"),
      });
    } catch (error) {
      toastError({
        message: getDisputeApiErrorMessage(error, t("acceptError")),
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleDecline = async () => {
    if (!dispute) return;
    if (declineReason.trim().length < 5) {
      toastError({
        message: t("declineReasonRequired"),
      });
      return;
    }
    setIsBusy(true);
    try {
      const res = await disputeApiRequest.respondToDispute(dispute.id, {
        action: "DECLINE",
        reason: declineReason.trim(),
      });
      await invalidateAll(res.data);
      setShowDeclineForm(false);
      setDeclineReason("");
      toastSuccess({
        message: t("declineSuccess"),
      });
    } catch (error) {
      toastError({
        message: getDisputeApiErrorMessage(error, t("declineError")),
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleWithdraw = async () => {
    if (!dispute) return;
    setIsBusy(true);
    try {
      const res = await disputeApiRequest.withdrawDispute(dispute.id);
      await invalidateAll(res.data);
      toastSuccess({
        message: t("withdrawSuccess"),
      });
      onOpenChange(false);
    } catch (error) {
      toastError({
        message: getDisputeApiErrorMessage(error, t("withdrawError")),
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleEscalate = async () => {
    if (!dispute) return;
    setIsBusy(true);
    try {
      const res = await disputeApiRequest.escalateDispute(dispute.id);
      await invalidateAll(res.data);
      toastSuccess({
        message: t("escalateSuccess"),
      });
    } catch (error) {
      toastError({
        message: getDisputeApiErrorMessage(error, t("escalateError")),
      });
    } finally {
      setIsBusy(false);
    }
  };

  const handleDecisionReview = async (response: "ACCEPTED" | "REJECTED") => {
    if (!dispute) return;
    if (response === "REJECTED" && rejectDecisionReason.trim().length < 5) {
      toastError({
        message: t("reviewReasonRequired"),
      });
      return;
    }
    setIsBusy(true);
    try {
      const res = await disputeApiRequest.submitDecisionReview(dispute.id, {
        response,
        ...(response === "REJECTED" && { reason: rejectDecisionReason.trim() }),
      });
      await invalidateAll(res.data);
      setShowRejectDecisionForm(false);
      setRejectDecisionReason("");
      toastSuccess({
        message:
          response === "ACCEPTED"
            ? t("reviewAcceptSuccess")
            : t("reviewRejectSuccess"),
      });
    } catch (error) {
      toastError({
        message: getDisputeApiErrorMessage(error, t("reviewError")),
      });
    } finally {
      setIsBusy(false);
    }
  };

  const isOpener = Boolean(
    dispute && currentUserId && dispute.openedById === currentUserId,
  );
  const isRespondent = Boolean(
    dispute && currentUserId && dispute.respondentId === currentUserId,
  );
  const isWaitingResponse =
    dispute?.status === "OPEN" || dispute?.status === "WAITING_RESPONSE";
  const countdown = getCountdown(dispute?.responseDeadline);
  const canRespond =
    isRespondent && isWaitingResponse && !dispute?.declinedAt;
  const canWithdraw = isOpener && isWaitingResponse;
  const canEscalate =
    (isOpener || isRespondent) &&
    isWaitingResponse &&
    (Boolean(dispute?.declinedAt) || countdown.isExpired);

  const myDecisionReview = dispute?.decisionReviews?.find(
    (r) => r.userId === currentUserId,
  );
  const canReviewDecision =
    dispute?.status === "DECISION_MADE" &&
    (isOpener || isRespondent) &&
    (!myDecisionReview || myDecisionReview.response === "PENDING");

  const activeStepIndex = !dispute
    ? 0
    : dispute.status === "FINALIZED" || dispute.status === "CANCELLED"
      ? 4
      : dispute.status === "DECISION_MADE" ||
          dispute.status === "REVIEW_REQUESTED"
        ? 3
        : dispute.status === "UNDER_REVIEW"
          ? 2
          : 1;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg overflow-y-auto p-6 flex flex-col justify-between font-sans border-l border-border bg-white dark:bg-zinc-950 z-50"
      >
        {isLoading || !dispute ? (
          <div className="py-20 flex flex-col items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
            <span>{t("loading")}</span>
          </div>
        ) : (
          <div className="space-y-5">
            {/* Header */}
            <SheetHeader className="p-0 pb-4 border-b border-zinc-200/80 dark:border-zinc-800 space-y-2">
              <div className="flex items-start justify-between gap-2 pr-6">
                <div>
                  <SheetTitle className="text-base font-medium text-foreground flex items-center gap-2">
                    <Scale className="size-4 text-muted-foreground" />
                    {t("title", { id: String(dispute.id).padStart(4, "0") })}
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                    {dispute.milestone?.title ||
                      t("milestoneFallback", { id: dispute.milestoneId })}
                  </SheetDescription>
                </div>
                <DisputeStatusBadge
                  status={dispute.status}
                  declinedAt={dispute.declinedAt}
                />
              </div>

              {isWaitingResponse && !dispute.declinedAt && (
                <div className="inline-flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-300">
                  <Clock className="size-3.5" />
                  <span>{countdown.label}</span>
                </div>
              )}
            </SheetHeader>

            {/* 4-Step Progress Bar */}
            <div className="grid grid-cols-4 gap-1.5 text-[10px]">
              {[
                { idx: 1, label: t("stepRequest") },
                { idx: 2, label: t("stepResponse") },
                { idx: 3, label: t("stepExpert") },
                { idx: 4, label: t("stepResolved") },
              ].map((s) => (
                <div key={s.idx} className="space-y-1">
                  <div
                    className={`h-1 rounded-full ${
                      activeStepIndex >= s.idx
                        ? "bg-zinc-900 dark:bg-zinc-100"
                        : "bg-zinc-200 dark:bg-zinc-800"
                    }`}
                  />
                  <span
                    className={`block truncate ${
                      activeStepIndex >= s.idx
                        ? "text-foreground font-medium"
                        : "text-muted-foreground"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Proposed Resolution Summary */}
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/30 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-muted-foreground">
                  {t("proposedResolution")}
                </span>
                <span className="font-medium text-foreground">
                  {getTypeLabel(dispute.resolutionType)}
                </span>
              </div>

              {dispute.resolutionType === "EXTEND_DEADLINE" &&
                dispute.proposedDueDate && (
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">
                      {t("newDueDate")}
                    </span>
                    <span className="font-medium text-foreground">
                      {formatDate(dispute.proposedDueDate)}
                    </span>
                  </div>
                )}

              {dispute.resolutionType !== "EXTEND_DEADLINE" && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-muted-foreground">
                    {t("proposedSplit")}
                  </span>
                  <span className="font-medium text-foreground tabular-nums">
                    {t("splitValue", {
                      clientAmount: formatResolutionCurrency(
                        dispute.proposedClientAmount ??
                          (dispute.resolutionType === "FULL_RELEASE"
                            ? 0
                            : (dispute.milestone?.amount ?? 0)),
                      ),
                      freelancerAmount: formatResolutionCurrency(
                        dispute.proposedFreelancerAmount ??
                          (dispute.resolutionType === "FULL_RELEASE"
                            ? (dispute.milestone?.amount ?? 0)
                            : 0),
                      ),
                    })}
                  </span>
                </div>
              )}

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-zinc-200/60 dark:border-zinc-800">
                <span className="text-muted-foreground">
                  {t("milestoneEscrow")}
                </span>
                <span className="tabular-nums text-foreground">
                  {formatResolutionCurrency(dispute.milestone?.amount ?? 0)}
                </span>
              </div>
            </div>

            {/* Claim Details */}
            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>
                    {t("openedBy")}{" "}
                    <strong className="font-medium text-foreground">
                      {isOpener
                        ? t("you")
                        : dispute.openedBy?.email || t("counterparty")}
                    </strong>
                  </span>
                  <span>{formatDateTime(dispute.createdAt)}</span>
                </div>
                <p className="font-medium text-foreground">
                  {translateStoredReason(dispute.reason)}
                </p>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {dispute.description}
                </p>
              </div>

              {/* Evidence Files */}
              {dispute.evidences &&
                dispute.evidences.some((ev) => ev.file?.fileUrl) && (
                  <div className="space-y-1.5">
                    <span className="text-[11px] font-medium text-muted-foreground block">
                      {t("attachedEvidence")}
                    </span>
                    <div className="space-y-1.5">
                      {dispute.evidences
                        .filter((ev) => ev.file?.fileUrl)
                        .map((ev) => (
                          <a
                            key={ev.id}
                            href={ev.file!.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 rounded-lg border border-zinc-200/80 dark:border-zinc-800 px-3 py-2 text-xs text-foreground hover:bg-zinc-50 dark:hover:bg-zinc-900/40 transition-colors"
                          >
                            <FileText className="size-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">
                              {ev.file?.fileName ||
                                t("evidenceFallback", { id: ev.id })}
                            </span>
                          </a>
                        ))}
                    </div>
                  </div>
                )}

              {/* Decline Reason Box */}
              {dispute.declineReason && (
                <div className="rounded-xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 p-3.5 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-rose-700 dark:text-rose-300">
                    <span className="font-medium">{t("proposalDeclined")}</span>
                    {dispute.declinedAt && (
                      <span>{formatDateTime(dispute.declinedAt)}</span>
                    )}
                  </div>
                  <p className="text-xs text-rose-900 dark:text-rose-200 leading-relaxed whitespace-pre-wrap">
                    {dispute.declineReason}
                  </p>
                </div>
              )}

              {/* Arbitrator Decision Box */}
              {(dispute.status === "DECISION_MADE" ||
                dispute.status === "REVIEW_REQUESTED" ||
                dispute.status === "FINALIZED") &&
                dispute.decisionReason && (
                  <div className="rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/25 p-3.5 space-y-1.5">
                    <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 block">
                      {dispute.status === "FINALIZED"
                        ? t("finalOutcome")
                        : t("expertDecision")}
                    </span>
                    {dispute.freelancerAmount !== null &&
                      dispute.freelancerAmount !== undefined && (
                        <p className="text-xs font-medium text-foreground tabular-nums">
                          {t("decisionAmounts", {
                            clientAmount: formatResolutionCurrency(
                              dispute.clientAmount ?? 0,
                            ),
                            freelancerAmount: formatResolutionCurrency(
                              dispute.freelancerAmount,
                            ),
                          })}
                        </p>
                      )}
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {dispute.decisionReason}
                    </p>
                  </div>
                )}
            </div>

            {/* Action Panels */}
            {canRespond && (
              <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-4 space-y-3">
                <p className="text-xs font-medium text-foreground">
                  {t("respondTitle")}
                </p>
                {!showDeclineForm ? (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => void handleAccept()}
                      className="flex-1 h-9 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 text-white text-xs cursor-pointer"
                    >
                      {isBusy ? (
                        <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                      ) : (
                        <Check className="mr-1.5 size-3.5" />
                      )}
                      {t("acceptProposal")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => setShowDeclineForm(true)}
                      className="flex-1 h-9 rounded-lg text-xs cursor-pointer"
                    >
                      <X className="mr-1.5 size-3.5" />
                      {t("decline")}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <Textarea
                      rows={3}
                      placeholder={t("declinePlaceholder")}
                      value={declineReason}
                      onChange={(e) => setDeclineReason(e.target.value)}
                      className="text-xs resize-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => setShowDeclineForm(false)}
                        className="h-8 rounded-lg text-xs cursor-pointer"
                      >
                        {t("cancel")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => void handleDecline()}
                        className="h-8 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs cursor-pointer"
                      >
                        {isBusy && (
                          <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                        )}
                        {t("confirmDecline")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Escalate & Withdraw Controls */}
            {(canEscalate || canWithdraw) && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                {canEscalate && (
                  <Button
                    type="button"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => void handleEscalate()}
                    className="flex-1 h-9 rounded-lg bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs cursor-pointer"
                  >
                    {isBusy ? (
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    ) : (
                      <ShieldAlert className="mr-1.5 size-3.5" />
                    )}
                    {t("escalateToExpert")}
                  </Button>
                )}

                {canWithdraw && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isBusy}
                    onClick={() => void handleWithdraw()}
                    className="h-9 rounded-lg text-xs cursor-pointer"
                  >
                    <Undo2 className="mr-1.5 size-3.5" />
                    {t("withdrawRequest")}
                  </Button>
                )}
              </div>
            )}

            {/* Arbitrator Decision Review */}
            {canReviewDecision && (
              <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-4 space-y-3">
                <p className="text-xs font-medium text-foreground">
                  {t("reviewDecisionTitle")}
                </p>
                {!showRejectDecisionForm ? (
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => void handleDecisionReview("ACCEPTED")}
                      className="flex-1 h-9 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs cursor-pointer"
                    >
                      <Check className="mr-1.5 size-3.5" />
                      {t("acceptDecision")}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isBusy}
                      onClick={() => setShowRejectDecisionForm(true)}
                      className="flex-1 h-9 rounded-lg text-xs cursor-pointer"
                    >
                      <AlertTriangle className="mr-1.5 size-3.5" />
                      {t("requestFinalReview")}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    <Textarea
                      rows={3}
                      placeholder={t("rejectDecisionPlaceholder")}
                      value={rejectDecisionReason}
                      onChange={(e) => setRejectDecisionReason(e.target.value)}
                      className="text-xs resize-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => setShowRejectDecisionForm(false)}
                        className="h-8 rounded-lg text-xs cursor-pointer"
                      >
                        {t("cancel")}
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        disabled={isBusy}
                        onClick={() => void handleDecisionReview("REJECTED")}
                        className="h-8 rounded-lg bg-amber-600 hover:bg-amber-700 text-white text-xs cursor-pointer"
                      >
                        {t("submitReviewRequest")}
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <SheetFooter className="p-0 pt-4 mt-6 border-t border-zinc-200/80 dark:border-zinc-800 flex-row justify-end">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-lg text-xs h-8 px-4 cursor-pointer"
          >
            {t("close")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
