"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  Loader2,
  Paperclip,
  Scale,
  ShieldAlert,
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
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { disputeApiRequest } from "@/apiRequests/dispute";
import type {
  DisputeDetailType,
  DisputeResolutionTypeType,
  MilestoneType,
  SharedFileType,
} from "@shared/types";
import {
  formatResolutionCurrency,
  getDisputeApiErrorMessage,
} from "./resolution-utils";

interface OpenResolutionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: number;
  contractExpiresAt?: string | Date | null;
  milestone: MilestoneType | null;
  sharedFiles?: SharedFileType[];
  onCreated?: (dispute: DisputeDetailType) => void;
}

/**
 * Simplified 2-tier Milestone Dispute slide-over sheet from the right.
 * User enters requested split amount + reason + description + optional files.
 * If counterparty accepts, funds are split immediately.
 * If declined or expired, escalates directly to Expert for binding arbitration and settlement.
 */
export function OpenResolutionDialog({
  open,
  onOpenChange,
  contractId,
  milestone,
  sharedFiles = [],
  onCreated,
}: OpenResolutionDialogProps) {
  const t = useTranslations("resolutionCenter.openDialog");
  const queryClient = useQueryClient();

  const [reason, setReason] = useState<string>("");
  const [clientAmount, setClientAmount] = useState<string>("");
  const [freelancerAmount, setFreelancerAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [selectedFileIds, setSelectedFileIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const milestoneAmount = Number(milestone?.amount ?? 0);

  const { data: reasonsData } = useQuery({
    queryKey: ["resolution-reasons", milestone?.id],
    queryFn: async () => {
      if (!milestone) return null;
      const res = await disputeApiRequest.getResolutionReasons(milestone.id);
      return res.data;
    },
    enabled: open && Boolean(milestone?.id),
  });

  useEffect(() => {
    if (open && milestone) {
      setReason("");
      setDescription("");
      setSelectedFileIds([]);

      // Default split based on role:
      // Client requesting dispute defaults to full refund request
      // Freelancer requesting dispute defaults to full release request
      if (reasonsData?.role === "FREELANCER") {
        setFreelancerAmount(milestoneAmount.toString());
        setClientAmount("0");
      } else {
        setClientAmount(milestoneAmount.toString());
        setFreelancerAmount("0");
      }
    }
  }, [open, milestone, milestoneAmount, reasonsData?.role]);

  if (!milestone) return null;

  const handleClientAmountChange = (raw: string) => {
    if (raw === "") {
      setClientAmount("");
      setFreelancerAmount("");
      return;
    }
    let clean = raw.replace(/[^\d.]/g, "");
    if (/^0\d/.test(clean)) {
      clean = clean.replace(/^0+/, "");
      if (clean === "") clean = "0";
    }
    const parsed = parseFloat(clean);
    if (isNaN(parsed)) {
      setClientAmount(clean);
      return;
    }
    const safe = Math.max(0, Math.min(milestoneAmount, Math.round(parsed * 100) / 100));
    setClientAmount(clean);
    setFreelancerAmount(Number((milestoneAmount - safe).toFixed(2)).toString());
  };

  const handleFreelancerAmountChange = (raw: string) => {
    if (raw === "") {
      setFreelancerAmount("");
      setClientAmount("");
      return;
    }
    let clean = raw.replace(/[^\d.]/g, "");
    if (/^0\d/.test(clean)) {
      clean = clean.replace(/^0+/, "");
      if (clean === "") clean = "0";
    }
    const parsed = parseFloat(clean);
    if (isNaN(parsed)) {
      setFreelancerAmount(clean);
      return;
    }
    const safe = Math.max(0, Math.min(milestoneAmount, Math.round(parsed * 100) / 100));
    setFreelancerAmount(clean);
    setClientAmount(Number((milestoneAmount - safe).toFixed(2)).toString());
  };

  const handleClientBlur = () => {
    if (clientAmount === "") {
      setClientAmount("0");
      setFreelancerAmount(milestoneAmount.toString());
    }
  };

  const handleFreelancerBlur = () => {
    if (freelancerAmount === "") {
      setFreelancerAmount("0");
      setClientAmount(milestoneAmount.toString());
    }
  };

  const handlePresetSplit = (clientPct: number) => {
    const cl = Number(((milestoneAmount * clientPct) / 100).toFixed(2));
    const fl = Number((milestoneAmount - cl).toFixed(2));
    setClientAmount(cl.toString());
    setFreelancerAmount(fl.toString());
  };

  const toggleEvidenceFile = (fileId: number) => {
    setSelectedFileIds((prev) => {
      if (prev.includes(fileId)) {
        return prev.filter((id) => id !== fileId);
      }
      if (prev.length >= 5) {
        toastError({ message: t("maxEvidenceToast") });
        return prev;
      }
      return [...prev, fileId];
    });
  };

  const clientNum = parseFloat(clientAmount) || 0;
  const freelancerNum = parseFloat(freelancerAmount) || 0;

  const isSplitValid =
    clientAmount !== "" &&
    freelancerAmount !== "" &&
    Math.abs(
      Number((clientNum + freelancerNum).toFixed(2)) -
      Number(milestoneAmount.toFixed(2)),
    ) < 0.01;

  const isFormValid =
    reason.trim().length >= 3 &&
    description.trim().length >= 10 &&
    isSplitValid;

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setIsSubmitting(true);
    try {
      const resolutionType: DisputeResolutionTypeType =
        clientNum === milestoneAmount
          ? "FULL_REFUND"
          : freelancerNum === milestoneAmount
            ? "FULL_RELEASE"
            : "PARTIAL_REFUND";

      const payload = {
        milestoneId: milestone.id,
        reason: reason.trim(),
        description: description.trim(),
        resolutionType,
        proposedClientAmount: clientNum,
        proposedFreelancerAmount: freelancerNum,
        ...(selectedFileIds.length > 0 && {
          evidenceFiles: selectedFileIds.map((fileId) => ({ fileId })),
        }),
      };

      const res = await disputeApiRequest.createDispute(payload);
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["client-contract-detail", contractId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["client-contract-milestones", contractId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["milestone-detail", contractId, milestone.id],
        }),
        queryClient.invalidateQueries({ queryKey: ["my-disputes"] }),
        queryClient.invalidateQueries({
          queryKey: ["milestone-dispute", milestone.id],
        }),
      ]);

      toastSuccess({
        message: t("submitSuccess"),
      });
      onOpenChange(false);
      if (res.data && onCreated) {
        onCreated(res.data);
      }
    } catch (error) {
      toastError({
        message: getDisputeApiErrorMessage(error, t("submitError")),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const clientPct =
    milestoneAmount > 0
      ? Math.round((clientNum / milestoneAmount) * 100)
      : 50;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-xl overflow-y-auto p-6 flex flex-col justify-between font-sans border-l border-border bg-white dark:bg-zinc-950 z-50"
      >
        <div className="space-y-5">
          <SheetHeader className="p-0 pb-4 border-b border-border space-y-1">
            <div className="flex items-center gap-2">
              <Scale className="size-4 text-foreground" />
              <SheetTitle className="text-base font-semibold">
                {t("title")}
              </SheetTitle>
            </div>
            <SheetDescription className="text-xs text-muted-foreground">
              {t("subtitle", {
                title: milestone.title,
                amount: formatResolutionCurrency(milestoneAmount),
              })}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 py-1">
            {/* SECTION 1: Số tiền mong muốn phân chia */}
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/40 p-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground">
                  {t("escrowSplitProposal")}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums font-medium">
                  {t("totalAmount", {
                    amount: formatResolutionCurrency(milestoneAmount),
                  })}
                </span>
              </div>

              {/* Split Amount Inputs */}
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="clientSplitInput" className="text-xs font-medium text-foreground">
                    {t("refundToClient")}
                  </Label>
                  <Input
                    id="clientSplitInput"
                    type="text"
                    inputMode="decimal"
                    value={clientAmount}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleClientAmountChange(e.target.value)}
                    onBlur={handleClientBlur}
                    placeholder="0.00"
                    className="h-9 text-xs tabular-nums font-medium"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="freelancerSplitInput" className="text-xs font-medium text-foreground">
                    {t("payToFreelancer")}
                  </Label>
                  <Input
                    id="freelancerSplitInput"
                    type="text"
                    inputMode="decimal"
                    value={freelancerAmount}
                    onFocus={(e) => e.target.select()}
                    onChange={(e) => handleFreelancerAmountChange(e.target.value)}
                    onBlur={handleFreelancerBlur}
                    placeholder="0.00"
                    className="h-9 text-xs tabular-nums font-medium"
                  />
                </div>
              </div>

              {/* Quick Presets */}
              <div className="flex items-center gap-2 pt-1 flex-wrap">
                <span className="text-[11px] text-muted-foreground">
                  {t("quickSplitPresets")}
                </span>
                <button
                  type="button"
                  onClick={() => handlePresetSplit(100)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${clientNum === milestoneAmount
                    ? "border-blue-600 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium"
                    : "border-border hover:bg-muted/50 text-muted-foreground"
                    }`}
                >
                  {t("presetRefundClient")}
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetSplit(50)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${clientNum === Number((milestoneAmount / 2).toFixed(2))
                    ? "border-zinc-900 dark:border-zinc-100 bg-zinc-100 dark:bg-zinc-800 font-medium"
                    : "border-border hover:bg-muted/50 text-muted-foreground"
                    }`}
                >
                  {t("presetFiftyFifty")}
                </button>
                <button
                  type="button"
                  onClick={() => handlePresetSplit(0)}
                  className={`text-[11px] px-2.5 py-1 rounded-full border transition-colors cursor-pointer ${freelancerNum === milestoneAmount
                    ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium"
                    : "border-border hover:bg-muted/50 text-muted-foreground"
                    }`}
                >
                  {t("presetPayFreelancer")}
                </button>
              </div>

              {!isSplitValid && (
                <p className="text-[11px] text-rose-600">
                  {t("splitInvalid", {
                    amount: formatResolutionCurrency(milestoneAmount),
                  })}
                </p>
              )}
            </div>

            {/* SECTION 2: Lý do tranh chấp */}
            <div className="space-y-2">
              <Label htmlFor="disputeReasonInput" className="text-xs font-semibold text-foreground">
                {t("summaryReason")} <span className="text-rose-500">*</span>
              </Label>
              <Input
                id="disputeReasonInput"
                type="text"
                placeholder={t("reasonPlaceholder")}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            {/* SECTION 3: Mô tả chi tiết */}
            <div className="space-y-1.5">
              <Label htmlFor="resolutionDescription" className="text-xs font-semibold text-foreground">
                {t("explainLabel")} <span className="text-rose-500">*</span>
              </Label>
              <Textarea
                id="resolutionDescription"
                rows={4}
                placeholder={t("explainPlaceholder")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs resize-none"
              />
              <p className="text-[11px] text-muted-foreground">
                {t("charactersMin", { count: description.trim().length })}
              </p>
            </div>

            {/* SECTION 4: Tệp bằng chứng (Tùy chọn) */}
            {sharedFiles.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5 text-foreground">
                  <Paperclip className="size-3.5 text-muted-foreground" />
                  {t("attachEvidence", { count: selectedFileIds.length })}
                </Label>
                <div className="max-h-28 overflow-y-auto rounded-xl border border-zinc-200/80 dark:border-zinc-800 divide-y divide-zinc-100 dark:divide-zinc-800/80">
                  {sharedFiles.map((file) => {
                    const checked = selectedFileIds.includes(file.id);
                    return (
                      <label
                        key={file.id}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-zinc-50 dark:hover:bg-zinc-900/40 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleEvidenceFile(file.id)}
                          className="rounded border-zinc-300"
                        />
                        <span className="truncate text-foreground">
                          {file.fileName || t("fileFallback", { id: file.id })}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notice: Quy trình 2 bước rõ ràng */}
            <div className="rounded-xl border border-blue-200/80 dark:border-blue-900/60 bg-blue-50/60 dark:bg-blue-950/30 p-3.5 space-y-1.5 text-xs text-blue-900 dark:text-blue-200">
              <div className="flex items-center gap-1.5 font-medium text-blue-950 dark:text-blue-100">
                <ShieldAlert className="size-4 shrink-0 text-blue-600 dark:text-blue-400" />
                <span>{t("twoTierNoticeTitle")}</span>
              </div>
              <ul className="text-[11px] space-y-1 text-blue-800/90 dark:text-blue-300 list-disc list-inside">
                <li>{t("twoTierStep1")}</li>
                <li>{t("twoTierStep2")}</li>
              </ul>
            </div>
          </div>
        </div>

        <SheetFooter className="p-0 pt-4 mt-4 border-t border-border flex-row items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 rounded-lg text-xs cursor-pointer"
          >
            {t("cancel")}
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={!isFormValid || isSubmitting}
            onClick={() => void handleSubmit()}
            className="h-9 px-4 rounded-lg bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-medium cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <AlertCircle className="mr-1.5 size-3.5" />
            )}
            {t("submitRequest")}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
