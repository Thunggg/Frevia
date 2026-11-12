"use client";

import { disputeApiRequest } from "@/apiRequests/dispute";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type { DisputeDetailType } from "@shared/types";
import { DisputeStatusEnum } from "@shared/types";
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  Scale,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useActionPermission } from "@/hooks/use-action-permission";

export function DisputeDetailDialog({
  dispute,
  open,
  onOpenChange,
}: {
  dispute: DisputeDetailType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("adminDisputes");
  const router = useRouter();
  const { can } = useActionPermission();

  const [freelancerAmount, setFreelancerAmount] = useState<number>(0);
  const [clientAmount, setClientAmount] = useState<number>(0);
  const [decisionReason, setDecisionReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canViewDetail = dispute
    ? can("GET", `/api/admin/disputes/${dispute.id}`)
    : false;
  const canDecision = dispute
    ? can("POST", `/api/admin/disputes/${dispute.id}/decision`)
    : false;
  const canFinalDecision = dispute
    ? can("POST", `/api/admin/disputes/${dispute.id}/final-decision`)
    : false;

  const milestoneAmount = dispute?.milestone?.amount
    ? Number(dispute.milestone.amount)
    : 0;

  useEffect(() => {
    if (dispute) {
      if (dispute.freelancerAmount !== null && dispute.freelancerAmount !== undefined) {
        setFreelancerAmount(Number(dispute.freelancerAmount));
        setClientAmount(Number(dispute.clientAmount ?? 0));
      } else {
        // Mặc định chia đôi 50/50
        const half = Number((milestoneAmount / 2).toFixed(2));
        setFreelancerAmount(half);
        setClientAmount(Number((milestoneAmount - half).toFixed(2)));
      }
      setDecisionReason(dispute.decisionReason ?? "");
    }
  }, [dispute, milestoneAmount]);

  if (!dispute || !canViewDetail) return null;

  const handlePresetSplit = (clientPct: number) => {
    const client = Number(((milestoneAmount * clientPct) / 100).toFixed(2));
    const fl = Number((milestoneAmount - client).toFixed(2));
    setClientAmount(client);
    setFreelancerAmount(fl);
  };

  const handleClientAmountChange = (val: number) => {
    setClientAmount(val);
    const remaining = Number((milestoneAmount - val).toFixed(2));
    setFreelancerAmount(remaining >= 0 ? remaining : 0);
  };

  const handleFreelancerAmountChange = (val: number) => {
    setFreelancerAmount(val);
    const remaining = Number((milestoneAmount - val).toFixed(2));
    setClientAmount(remaining >= 0 ? remaining : 0);
  };

  const currentTotal = Number((freelancerAmount + clientAmount).toFixed(2));
  const isSplitValid = Math.abs(currentTotal - milestoneAmount) < 0.01;

  const canMakeDecision =
    canDecision &&
    (dispute.status === DisputeStatusEnum.enum.OPEN ||
      dispute.status === DisputeStatusEnum.enum.WAITING_RESPONSE ||
      dispute.status === DisputeStatusEnum.enum.UNDER_REVIEW);

  const canMakeFinalDecision =
    canFinalDecision &&
    (dispute.status === DisputeStatusEnum.enum.REVIEW_REQUESTED ||
      dispute.status === DisputeStatusEnum.enum.DECISION_MADE);

  const handleSubmitDecision = async (isFinal: boolean) => {
    if (!isSplitValid) {
      toastError({
        message: t("splitMismatchToast", {
          milestone: `$${milestoneAmount}`,
          current: `$${currentTotal}`,
        }),
      });
      return;
    }

    if (!decisionReason || decisionReason.trim().length < 5) {
      toastError({ message: t("reasonRequiredToast") });
      return;
    }

    setIsSubmitting(true);
    try {
      if (isFinal) {
        await disputeApiRequest.adminFinalDecision(dispute.id, {
          freelancerAmount,
          clientAmount,
          decisionReason,
        });
        toastSuccess({ message: t("finalDecisionToast") });
      } else {
        await disputeApiRequest.adminMakeDecision(dispute.id, {
          freelancerAmount,
          clientAmount,
          decisionReason,
        });
        toastSuccess({ message: t("proposedDecisionToast") });
      }
      onOpenChange(false);
      router.refresh();
    } catch {
      toastError({ message: t("submitFailed") });
    } finally {
      setIsSubmitting(false);
    }
  };

  const claimEvidences =
    dispute.evidences?.filter((ev) => ev.type === "CLAIM") ?? [];
  const responseEvidences =
    dispute.evidences?.filter((ev) => ev.type === "RESPONSE") ?? [];
  const rebuttalDescription = responseEvidences.find(
    (ev) => ev.description,
  )?.description;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-bold">
            <Scale className="size-5 text-[#4fae2e]" />
            {t("dialogTitle", { id: dispute.id })}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Thông tin chung */}
          <div className="grid grid-cols-2 gap-4 rounded-xl border border-border bg-muted/40 p-4 sm:grid-cols-4">
            <div>
              <p className="text-xs text-muted-foreground">{t("milestoneLabel")}</p>
              <p className="font-semibold text-foreground">
                {dispute.milestone?.title ?? t("milestoneFallback", { id: dispute.id })}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("amountLabel")}</p>
              <p className="text-base font-bold text-[#4fae2e]">
                ${milestoneAmount}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("clientLabel")}</p>
              <p className="truncate text-xs font-medium text-foreground">
                {dispute.openedBy?.email ?? dispute.openedById}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">{t("freelancerLabel")}</p>
              <p className="truncate text-xs font-medium text-foreground">
                {dispute.respondent?.email ?? dispute.respondentId}
              </p>
            </div>
          </div>

          {/* Nội dung khiếu nại */}
          <div className="space-y-3 rounded-xl border border-border p-4">
            <h3 className="flex items-center gap-2 font-semibold text-foreground">
              <AlertCircle className="size-4 text-amber-500" />
              {t("claimByInitiator")}
            </h3>
            <p className="text-sm">
              <strong className="text-muted-foreground">{t("reasonLabel")}</strong>{" "}
              {dispute.reason}
            </p>
            <p className="whitespace-pre-wrap text-sm text-foreground/90">
              <strong className="text-muted-foreground">{t("statementLabel")}</strong>{" "}
              {dispute.description}
            </p>

            {claimEvidences.length > 0 && (
              <div className="mt-3 space-y-2 border-t pt-2">
                <p className="text-xs font-medium text-muted-foreground">
                  {t("attachedClaimFiles")}
                </p>
                <div className="flex flex-wrap gap-2">
                  {claimEvidences.map((ev, i) => {
                    const url = ev.file?.fileUrl;
                    const name = ev.file?.fileName || t("evidenceFallback", { id: i + 1 });
                    if (!url) return null;

                    return (
                      <a
                        key={ev.id ?? i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs text-primary hover:bg-muted"
                      >
                        <FileText className="size-3.5" />
                        {name}
                        <ExternalLink className="size-3" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Phản hồi của bị đơn */}
          <div className="space-y-2 rounded-xl border border-border p-4">
            <h3 className="flex items-center gap-2 font-semibold text-foreground">
              <Clock className="size-4 text-blue-500" />
              {t("respondentRebuttal")}
            </h3>
            {rebuttalDescription ? (
              <p className="whitespace-pre-wrap text-sm text-foreground/90">
                {rebuttalDescription}
              </p>
            ) : (
              <p className="text-xs italic text-muted-foreground">
                {t("noRebuttalYet")}
              </p>
            )}

            {responseEvidences.length > 0 && (
              <div className="mt-3 space-y-2 border-t pt-2">
                <div className="flex flex-wrap gap-2">
                  {responseEvidences.map((ev, i) => {
                    const url = ev.file?.fileUrl;
                    const name = ev.file?.fileName || t("evidenceFallback", { id: i + 1 });
                    if (!url) return null;

                    return (
                      <a
                        key={ev.id ?? i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-xs text-primary hover:bg-muted"
                      >
                        <FileText className="size-3.5" />
                        {name}
                        <ExternalLink className="size-3" />
                      </a>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Trạng thái đã chốt */}
          {dispute.status === DisputeStatusEnum.enum.FINALIZED && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <h3 className="flex items-center gap-2 font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-4" />
                {t("caseFinalizedHeading")}
              </h3>
              <div className="mt-2 flex gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground">{t("clientRefundLabel")}</span>{" "}
                  <strong>${dispute.clientAmount}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">{t("freelancerPayoutLabel")}</span>{" "}
                  <strong>${dispute.freelancerAmount}</strong>
                </div>
              </div>
              {dispute.decisionReason && (
                <p className="mt-2 text-xs text-muted-foreground">
                  {t("finalizedReasonLabel", { reason: dispute.decisionReason })}
                </p>
              )}
            </div>
          )}

          {/* Biểu mẫu ra phán quyết (Nếu vụ việc đang trong giai đoạn xử lý) */}
          {(canMakeDecision || canMakeFinalDecision) && (
            <div className="space-y-4 rounded-xl border border-[#4fae2e]/30 bg-[#4fae2e]/5 p-5">
              <h3 className="font-semibold text-foreground">
                {canMakeFinalDecision
                  ? t("issueFinalRuling")
                  : t("issueProposedRuling")}
              </h3>

              {/* Nút chia nhanh */}
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetSplit(100)}
                >
                  {t("splitClient100")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetSplit(50)}
                >
                  {t("splitHalf")}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handlePresetSplit(0)}
                >
                  {t("splitFreelancer100")}
                </Button>
              </div>

              {/* Nhập số tiền chia */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="clientAmount">
                    {t("clientRefundInputLabel")}
                  </Label>
                  <Input
                    id="clientAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={milestoneAmount}
                    value={clientAmount}
                    onChange={(e) =>
                      handleClientAmountChange(parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="freelancerAmount">
                    {t("freelancerPayoutInputLabel")}
                  </Label>
                  <Input
                    id="freelancerAmount"
                    type="number"
                    step="0.01"
                    min="0"
                    max={milestoneAmount}
                    value={freelancerAmount}
                    onChange={(e) =>
                      handleFreelancerAmountChange(parseFloat(e.target.value) || 0)
                    }
                  />
                </div>
              </div>

              <div className="text-xs">
                <span className="font-medium text-muted-foreground">
                  {t("totalSplitLabel", {
                    total: `$${currentTotal}`,
                    milestone: `$${milestoneAmount}`,
                  })}
                </span>
                {!isSplitValid && (
                  <p className="mt-1 font-semibold text-destructive">
                    {t("sumMustEqual", { amount: `$${milestoneAmount}` })}
                  </p>
                )}
              </div>

              {/* Lý do phán quyết */}
              <div className="space-y-1.5">
                <Label htmlFor="decisionReason">
                  {t("findingsReasonLabel")}
                </Label>
                <Textarea
                  id="decisionReason"
                  rows={3}
                  placeholder={t("findingsPlaceholder")}
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                {canMakeDecision && (
                  <Button
                    type="button"
                    disabled={isSubmitting || !isSplitValid}
                    onClick={() => handleSubmitDecision(false)}
                    className="bg-[#4fae2e] text-white hover:bg-[#439626]"
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    {t("issueProposedDecision")}
                  </Button>
                )}
                {canMakeFinalDecision && (
                  <Button
                    type="button"
                    disabled={isSubmitting || !isSplitValid}
                    onClick={() => handleSubmitDecision(true)}
                    className="bg-[#4fae2e] text-white hover:bg-[#439626]"
                  >
                    {isSubmitting && (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    )}
                    {t("issueFinalRulingAction")}
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            {t("closeAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
