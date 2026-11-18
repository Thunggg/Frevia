"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Calendar,
  Check,
  Clock,
  Loader2,
  Paperclip,
  Scale,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
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
  ResolutionReasonItemType,
  SharedFileType,
} from "@shared/types";
import {
  formatResolutionCurrency,
  getDisputeApiErrorMessage,
  useResolutionHelpers,
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

function toDateInputValue(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * 3-step Fiverr-style Resolution Center dialog for opening a milestone resolution request.
 */
export function OpenResolutionDialog({
  open,
  onOpenChange,
  contractId,
  contractExpiresAt,
  milestone,
  sharedFiles = [],
  onCreated,
}: OpenResolutionDialogProps) {
  const t = useTranslations("resolutionCenter.openDialog");
  const { formatDate, getTypeLabel, getLocalizedReason } =
    useResolutionHelpers();
  const queryClient = useQueryClient();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedReason, setSelectedReason] =
    useState<ResolutionReasonItemType | null>(null);
  const [resolutionType, setResolutionType] =
    useState<DisputeResolutionTypeType>("FULL_REFUND");
  const [proposedDueDate, setProposedDueDate] = useState<string>("");
  const [clientAmount, setClientAmount] = useState<number>(0);
  const [freelancerAmount, setFreelancerAmount] = useState<number>(0);
  const [description, setDescription] = useState<string>("");
  const [selectedFileIds, setSelectedFileIds] = useState<number[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const milestoneAmount = Number(milestone?.amount ?? 0);

  const { data: reasonsData, isLoading: isLoadingReasons } = useQuery({
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
      setStep(1);
      setSelectedReason(null);
      setResolutionType("FULL_REFUND");
      setDescription("");
      setSelectedFileIds([]);

      const defaultHalf = Number((milestoneAmount / 2).toFixed(2));
      setClientAmount(defaultHalf);
      setFreelancerAmount(Number((milestoneAmount - defaultHalf).toFixed(2)));

      const baseDate = milestone.dueDate
        ? new Date(milestone.dueDate)
        : new Date();
      const suggested = new Date(
        Math.max(baseDate.getTime(), Date.now()) + 3 * 24 * 60 * 60 * 1000,
      );
      setProposedDueDate(toDateInputValue(suggested));
    }
  }, [open, milestone, milestoneAmount]);

  if (!milestone) return null;

  const reasons = reasonsData?.reasons ?? [];
  const allowedTypes: DisputeResolutionTypeType[] =
    selectedReason?.allowedResolutionTypes ?? [
      "FULL_REFUND",
      "PARTIAL_REFUND",
      "EXTEND_DEADLINE",
    ];

  const handleSelectReason = (reason: ResolutionReasonItemType) => {
    setSelectedReason(reason);
    const firstAllowed = reason.allowedResolutionTypes[0] ?? "FULL_REFUND";
    setResolutionType(firstAllowed);
  };

  const handleClientSplitChange = (val: number) => {
    const safe = Math.max(0, Math.min(milestoneAmount, val));
    setClientAmount(safe);
    setFreelancerAmount(Number((milestoneAmount - safe).toFixed(2)));
  };

  const handleFreelancerSplitChange = (val: number) => {
    const safe = Math.max(0, Math.min(milestoneAmount, val));
    setFreelancerAmount(safe);
    setClientAmount(Number((milestoneAmount - safe).toFixed(2)));
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

  const isSplitValid =
    Math.abs(
      Number((clientAmount + freelancerAmount).toFixed(2)) -
        Number(milestoneAmount.toFixed(2)),
    ) < 0.01;

  const isStep2Valid = () => {
    if (description.trim().length < 10) return false;
    if (resolutionType === "EXTEND_DEADLINE") {
      if (!proposedDueDate) return false;
      const parsed = new Date(`${proposedDueDate}T23:59:59.000Z`);
      if (Number.isNaN(parsed.getTime()) || parsed <= new Date()) return false;
    }
    if (resolutionType === "PARTIAL_REFUND" && !isSplitValid) {
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!selectedReason || !isStep2Valid()) return;
    setIsSubmitting(true);
    try {
      const payload = {
        milestoneId: milestone.id,
        reason: selectedReason.label,
        description: description.trim(),
        resolutionType,
        ...(resolutionType === "PARTIAL_REFUND" && {
          proposedClientAmount: clientAmount,
          proposedFreelancerAmount: freelancerAmount,
        }),
        ...(resolutionType === "EXTEND_DEADLINE" && {
          proposedDueDate: new Date(
            `${proposedDueDate}T23:59:59.000Z`,
          ).toISOString(),
        }),
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

  const minDateStr = toDateInputValue(
    new Date(Date.now() + 24 * 60 * 60 * 1000),
  );
  const maxDateStr = contractExpiresAt
    ? toDateInputValue(new Date(contractExpiresAt))
    : undefined;

  const selectedReasonLocalized = selectedReason
    ? getLocalizedReason(selectedReason, reasonsData?.role)
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto font-sans">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Scale className="size-4 text-foreground" />
            <DialogTitle className="text-base font-medium">
              {t("title")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {t("subtitle", {
              title: milestone.title,
              amount: formatResolutionCurrency(milestoneAmount),
            })}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground pb-2 border-b border-border/60">
          {[
            { num: 1, label: t("step1") },
            { num: 2, label: t("step2") },
            { num: 3, label: t("step3") },
          ].map((item) => (
            <span
              key={item.num}
              className={`rounded-full px-2.5 py-0.5 transition-colors ${
                step === item.num
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-medium"
                  : step > item.num
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300"
                    : "bg-zinc-100 dark:bg-zinc-800/70"
              }`}
            >
              {item.label}
            </span>
          ))}
        </div>

        {/* STEP 1: Select Reason */}
        {step === 1 && (
          <div className="space-y-3 py-1">
            <p className="text-xs text-muted-foreground">{t("issuePrompt")}</p>

            {isLoadingReasons ? (
              <div className="py-10 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                <span>{t("loadingOptions")}</span>
              </div>
            ) : (
              <div className="space-y-2">
                {reasons.map((item) => {
                  const isSelected = selectedReason?.code === item.code;
                  const localized = getLocalizedReason(item, reasonsData?.role);
                  return (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => handleSelectReason(item)}
                      className={`w-full text-left rounded-xl border p-3.5 transition-colors cursor-pointer ${
                        isSelected
                          ? "border-zinc-900 dark:border-zinc-200 bg-zinc-50/80 dark:bg-zinc-900/60"
                          : "border-zinc-200/80 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-0.5">
                          <p className="text-xs font-medium text-foreground">
                            {localized.label}
                          </p>
                          <p className="text-[11px] text-muted-foreground leading-relaxed">
                            {localized.description}
                          </p>
                        </div>
                        {isSelected && (
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900">
                            <Check className="size-3" />
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Proposal & Evidence */}
        {step === 2 && (
          <div className="space-y-4 py-1">
            {/* Resolution Type Selector */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">
                {t("proposedResolution")}
              </Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {allowedTypes.map((type) => {
                  const active = resolutionType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setResolutionType(type)}
                      className={`rounded-xl border px-3 py-2.5 text-left text-xs transition-colors cursor-pointer ${
                        active
                          ? "border-zinc-900 dark:border-zinc-200 bg-zinc-50 dark:bg-zinc-900 font-medium text-foreground"
                          : "border-zinc-200/80 dark:border-zinc-800 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {getTypeLabel(type)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Type-specific inputs */}
            {resolutionType === "EXTEND_DEADLINE" && (
              <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-3.5 space-y-2">
                <Label
                  htmlFor="proposedDueDate"
                  className="text-xs font-medium flex items-center gap-1.5"
                >
                  <Calendar className="size-3.5 text-muted-foreground" />
                  {t("newProposedDueDate")}
                </Label>
                <Input
                  id="proposedDueDate"
                  type="date"
                  min={minDateStr}
                  max={maxDateStr}
                  value={proposedDueDate}
                  onChange={(e) => setProposedDueDate(e.target.value)}
                  className="h-9 text-xs"
                />
                {contractExpiresAt && (
                  <p className="text-[11px] text-muted-foreground">
                    {t("dueDateLimit", {
                      date: formatDate(contractExpiresAt),
                    })}
                  </p>
                )}
              </div>
            )}

            {resolutionType === "PARTIAL_REFUND" && (
              <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 p-3.5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-foreground">
                    {t("escrowSplitProposal")}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {t("totalAmount", {
                      amount: formatResolutionCurrency(milestoneAmount),
                    })}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="clientSplit" className="text-[11px]">
                      {t("refundToClient")}
                    </Label>
                    <Input
                      id="clientSplit"
                      type="number"
                      min={0}
                      max={milestoneAmount}
                      step="0.01"
                      value={clientAmount}
                      onChange={(e) =>
                        handleClientSplitChange(Number(e.target.value))
                      }
                      className="h-8 text-xs tabular-nums"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="freelancerSplit" className="text-[11px]">
                      {t("payToFreelancer")}
                    </Label>
                    <Input
                      id="freelancerSplit"
                      type="number"
                      min={0}
                      max={milestoneAmount}
                      step="0.01"
                      value={freelancerAmount}
                      onChange={(e) =>
                        handleFreelancerSplitChange(Number(e.target.value))
                      }
                      className="h-8 text-xs tabular-nums"
                    />
                  </div>
                </div>
                {!isSplitValid && (
                  <p className="text-[11px] text-rose-600">
                    {t("splitInvalid", {
                      amount: formatResolutionCurrency(milestoneAmount),
                    })}
                  </p>
                )}
              </div>
            )}

            {/* Explanation */}
            <div className="space-y-1.5">
              <Label
                htmlFor="resolutionDescription"
                className="text-xs font-medium"
              >
                {t("explainLabel")}
              </Label>
              <Textarea
                id="resolutionDescription"
                rows={4}
                placeholder={t("explainPlaceholder")}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="text-xs resize-none"
              />
            </div>

            {/* Optional Shared Files Evidence */}
            {sharedFiles.length > 0 && (
              <div className="space-y-1.5">
                <Label className="text-xs font-medium flex items-center gap-1.5">
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
          </div>
        )}

        {/* STEP 3: Review & Confirm */}
        {step === 3 && selectedReason && (
          <div className="space-y-3 py-1 text-xs">
            <div className="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/30 p-4 divide-y divide-zinc-200/60 dark:divide-zinc-800">
              <div className="pb-2.5 flex justify-between gap-4">
                <span className="text-muted-foreground">
                  {t("summaryReason")}
                </span>
                <span className="text-foreground text-right font-medium">
                  {selectedReasonLocalized?.label ?? selectedReason.label}
                </span>
              </div>
              <div className="py-2.5 flex justify-between gap-4">
                <span className="text-muted-foreground">
                  {t("summaryAction")}
                </span>
                <span className="text-foreground text-right font-medium">
                  {getTypeLabel(resolutionType)}
                </span>
              </div>
              {resolutionType === "EXTEND_DEADLINE" && (
                <div className="py-2.5 flex justify-between gap-4">
                  <span className="text-muted-foreground">
                    {t("summaryNewDueDate")}
                  </span>
                  <span className="text-foreground text-right">
                    {formatDate(proposedDueDate)}
                  </span>
                </div>
              )}
              {resolutionType === "PARTIAL_REFUND" && (
                <div className="py-2.5 flex justify-between gap-4">
                  <span className="text-muted-foreground">
                    {t("summarySplit")}
                  </span>
                  <span className="text-foreground text-right tabular-nums">
                    {t("splitValue", {
                      clientAmount: formatResolutionCurrency(clientAmount),
                      freelancerAmount:
                        formatResolutionCurrency(freelancerAmount),
                    })}
                  </span>
                </div>
              )}
              {resolutionType === "FULL_REFUND" && (
                <div className="py-2.5 flex justify-between gap-4">
                  <span className="text-muted-foreground">
                    {t("summaryRefundAmount")}
                  </span>
                  <span className="text-foreground text-right tabular-nums">
                    {t("refundToClientValue", {
                      amount: formatResolutionCurrency(milestoneAmount),
                    })}
                  </span>
                </div>
              )}
              {resolutionType === "FULL_RELEASE" && (
                <div className="py-2.5 flex justify-between gap-4">
                  <span className="text-muted-foreground">
                    {t("summaryReleaseAmount")}
                  </span>
                  <span className="text-foreground text-right tabular-nums">
                    {t("releaseToFreelancerValue", {
                      amount: formatResolutionCurrency(milestoneAmount),
                    })}
                  </span>
                </div>
              )}
              <div className="pt-2.5 space-y-1">
                <span className="text-muted-foreground block">
                  {t("summaryMessage")}
                </span>
                <p className="text-foreground leading-relaxed whitespace-pre-wrap">
                  {description}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/60 dark:bg-amber-950/30 p-3 flex items-start gap-2 text-[11px] text-amber-900 dark:text-amber-200">
              <Clock className="size-3.5 shrink-0 mt-0.5 text-amber-600" />
              <span>
                {t.rich("escrowFreezeWarning", {
                  strong: (chunks) => <strong>{chunks}</strong>,
                })}
              </span>
            </div>
          </div>
        )}

        <DialogFooter className="flex-row items-center justify-between gap-2 pt-2 border-t border-border/60">
          {step > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isSubmitting}
              onClick={() => setStep((s) => (s === 3 ? 2 : 1))}
              className="h-8 rounded-lg text-xs cursor-pointer"
            >
              <ArrowLeft className="mr-1.5 size-3.5" />
              {t("back")}
            </Button>
          ) : (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-8 rounded-lg text-xs cursor-pointer"
            >
              {t("cancel")}
            </Button>
          )}

          {step === 1 && (
            <Button
              type="button"
              size="sm"
              disabled={!selectedReason}
              onClick={() => setStep(2)}
              className="h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 text-white text-xs cursor-pointer"
            >
              {t("continue")}
              <ArrowRight className="ml-1.5 size-3.5" />
            </Button>
          )}

          {step === 2 && (
            <Button
              type="button"
              size="sm"
              disabled={!isStep2Valid()}
              onClick={() => setStep(3)}
              className="h-8 rounded-lg bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 text-white text-xs cursor-pointer"
            >
              {t("reviewRequest")}
              <ArrowRight className="ml-1.5 size-3.5" />
            </Button>
          )}

          {step === 3 && (
            <Button
              type="button"
              size="sm"
              disabled={isSubmitting}
              onClick={() => void handleSubmit()}
              className="h-8 rounded-lg bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs cursor-pointer"
            >
              {isSubmitting ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <AlertCircle className="mr-1.5 size-3.5" />
              )}
              {t("submitRequest")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
