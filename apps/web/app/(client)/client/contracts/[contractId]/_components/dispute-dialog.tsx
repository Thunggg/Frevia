"use client";

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/shadcn/sheet";
import { Button } from "@repo/ui/components/shadcn/button";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  FileText,
  Gavel,
  Loader2,
  RotateCcw,
  Shield,
} from "@/components/icons";
import { disputeApiRequest } from "@/apiRequests/dispute";
import { ApiFail } from "@/lib/http";
import type {
  DisputeDetailType,
  MilestoneType,
  SharedFileType,
} from "@shared/types";

interface DisputeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: number;
  milestone: MilestoneType | null;
  sharedFiles?: SharedFileType[];
  currentUserId: number;
  isFreelancer: boolean;
  mode?: "CREATE" | "VIEW";
  onSuccess?: () => void;
}

function money(amount: number | string | null | undefined) {
  if (amount === null || amount === undefined) return "$0.00";
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(isNaN(num) ? 0 : num);
}

function formatDate(date: string | Date | null | undefined) {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function getStatusBadge(status: string) {
  switch (status) {
    case "OPEN":
      return {
        label: "Open • Fee Pending",
        className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
      };
    case "WAITING_RESPONSE":
      return {
        label: "Awaiting Rebuttal",
        className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
      };
    case "UNDER_REVIEW":
      return {
        label: "Under Admin Review",
        className: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30",
      };
    case "DECISION_MADE":
      return {
        label: "Decision Proposed",
        className: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30",
      };
    case "REVIEW_REQUESTED":
      return {
        label: "Secondary Review Requested",
        className: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
      };
    case "FINALIZED":
      return {
        label: "Resolved & Finalized",
        className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      };
    case "CANCELLED":
      return {
        label: "Cancelled",
        className: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30",
      };
    default:
      return {
        label: status,
        className: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/30",
      };
  }
}

export function DisputeDialog({
  open,
  onOpenChange,
  contractId,
  milestone,
  sharedFiles = [],
  currentUserId,
  isFreelancer,
  mode = "VIEW",
  onSuccess,
}: DisputeDialogProps) {
  const queryClient = useQueryClient();

  // Dialog internal view mode: CREATE or VIEW
  const [activeMode, setActiveMode] = useState<"CREATE" | "VIEW">(mode);

  // Form states for creating a dispute
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [selectedFileIds, setSelectedFileIds] = useState<number[]>([]);
  const [fileNotes, setFileNotes] = useState<Record<number, string>>({});
  const [isSubmittingDispute, setIsSubmittingDispute] = useState(false);

  // Form states for submitting rebuttal (Respondent)
  const [responseDescription, setResponseDescription] = useState("");
  const [responseFileIds, setResponseFileIds] = useState<number[]>([]);
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);

  // Form states for fee payment and decision review
  const [isPayingFee, setIsPayingFee] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showRejectInput, setShowRejectInput] = useState(false);

  useEffect(() => {
    setActiveMode(mode);
    if (!open) {
      setReason("");
      setDescription("");
      setSelectedFileIds([]);
      setFileNotes({});
      setResponseDescription("");
      setResponseFileIds([]);
      setRejectReason("");
      setShowRejectInput(false);
    }
  }, [open, mode]);

  // Fetch dispute details if in VIEW mode and milestone exists
  const {
    data: dispute,
    isLoading: isLoadingDispute,
    refetch: refetchDispute,
  } = useQuery<DisputeDetailType | null>({
    queryKey: ["dispute-detail", milestone?.id],
    queryFn: async () => {
      if (!milestone) return null;
      try {
        const res = await disputeApiRequest.getByMilestoneId(milestone.id);
        return res.data;
      } catch {
        return null;
      }
    },
    enabled: open && !!milestone,
  });

  if (!milestone) return null;

  // Toggle file selection helper
  const toggleFile = (
    fileId: number,
    list: number[],
    setList: (val: number[]) => void,
  ) => {
    if (list.includes(fileId)) {
      setList(list.filter((id) => id !== fileId));
    } else {
      if (list.length >= 5) {
        toastError({ message: "You can attach a maximum of 5 evidence files." });
        return;
      }
      setList([...list, fileId]);
    }
  };

  // Submit Open Dispute
  const handleCreateDispute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      toastError({ message: "Please specify a reason for this dispute." });
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      toastError({
        message: "Please provide a detailed description (at least 10 characters).",
      });
      return;
    }

    setIsSubmittingDispute(true);
    try {
      const evidenceFiles = selectedFileIds.map((fileId) => ({
        fileId,
        description: fileNotes[fileId] || undefined,
      }));

      await disputeApiRequest.createDispute({
        milestoneId: milestone.id,
        reason: reason.trim(),
        description: description.trim(),
        evidenceFiles: evidenceFiles.length > 0 ? evidenceFiles : undefined,
      });

      toastSuccess({
        message:
          "Dispute opened successfully. The milestone is now locked for arbitration.",
      });

      await queryClient.invalidateQueries({
        queryKey: ["client-contract-detail", contractId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-milestones", contractId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["dispute-detail", milestone.id],
      });

      setActiveMode("VIEW");
      onSuccess?.();
    } catch (error) {
      if (error instanceof ApiFail) {
        toastError({ message: error.message });
      } else {
        toastError({ message: "Failed to open dispute. Please try again." });
      }
    } finally {
      setIsSubmittingDispute(false);
    }
  };

  // Pay Arbitration Fee
  const handlePayFee = async () => {
    if (!dispute) return;
    setIsPayingFee(true);
    try {
      await disputeApiRequest.payFee(dispute.id);
      toastSuccess({
        message: "Arbitration fee paid successfully! Your case is proceeding.",
      });
      await refetchDispute();
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-milestones", contractId],
      });
    } catch (error) {
      if (error instanceof ApiFail) {
        toastError({ message: error.message });
      } else {
        toastError({ message: "Failed to pay arbitration fee." });
      }
    } finally {
      setIsPayingFee(false);
    }
  };

  // Submit Rebuttal
  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dispute) return;
    if (!responseDescription.trim() || responseDescription.trim().length < 10) {
      toastError({
        message: "Please provide a detailed rebuttal (at least 10 characters).",
      });
      return;
    }

    setIsSubmittingResponse(true);
    try {
      const evidenceFiles = responseFileIds.map((fileId) => ({
        fileId,
      }));

      await disputeApiRequest.submitResponse(dispute.id, {
        description: responseDescription.trim(),
        evidenceFiles: evidenceFiles.length > 0 ? evidenceFiles : undefined,
      });

      toastSuccess({
        message: "Your rebuttal and evidence have been submitted to the arbitrator.",
      });
      await refetchDispute();
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-milestones", contractId],
      });
    } catch (error) {
      if (error instanceof ApiFail) {
        toastError({ message: error.message });
      } else {
        toastError({ message: "Failed to submit rebuttal response." });
      }
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  // Submit Decision Review (Accept / Reject)
  const handleReviewDecision = async (response: "ACCEPTED" | "REJECTED") => {
    if (!dispute) return;
    if (response === "REJECTED" && !rejectReason.trim()) {
      toastError({
        message: "Please state your reason for rejecting the proposed settlement.",
      });
      return;
    }

    setIsSubmittingReview(true);
    try {
      await disputeApiRequest.submitDecisionReview(dispute.id, {
        response,
        reason: response === "REJECTED" ? rejectReason.trim() : undefined,
      });

      toastSuccess({
        message:
          response === "ACCEPTED"
            ? "You have accepted the arbitrator's proposal."
            : "You requested secondary review of the decision.",
      });
      await refetchDispute();
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-detail", contractId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-milestones", contractId],
      });
    } catch (error) {
      if (error instanceof ApiFail) {
        toastError({ message: error.message });
      } else {
        toastError({ message: "Failed to submit review." });
      }
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Helper flags
  const currentUserFee = dispute?.fees?.find((f) => f.userId === currentUserId);
  const isCurrentUserInitiator = dispute?.openedById === currentUserId;
  const isCurrentUserRespondent = dispute?.respondentId === currentUserId;
  const hasRespondentResponded = dispute?.evidences?.some(
    (e) => e.type === "RESPONSE",
  );
  const currentUserReview = dispute?.decisionReviews?.find(
    (r) => r.userId === currentUserId,
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto bg-background p-6 font-sans">
        {/* CREATE MODE: Open a new dispute */}
        {activeMode === "CREATE" ? (
          <form onSubmit={handleCreateDispute} className="space-y-6">
            <SheetHeader className="pb-4 border-b border-border/70 text-left space-y-1">
              <div className="flex items-center gap-2 text-red-600">
                <Gavel className="size-5" />
                <SheetTitle className="text-lg font-bold text-foreground">
                  Open Dispute / Arbitration
                </SheetTitle>
              </div>
              <SheetDescription className="text-xs text-muted-foreground">
                Initiate formal Frevia arbitration for this milestone.
              </SheetDescription>
            </SheetHeader>

            {/* Milestone Summary Header Card */}
            <div className="rounded-2xl border border-border bg-[#F1F0F5]/50 dark:bg-zinc-900/50 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">
                  Milestone Under Dispute
                </span>
                <span className="text-sm font-extrabold text-foreground">
                  {money(Number(milestone.amount))}
                </span>
              </div>
              <h3 className="text-sm font-bold text-foreground truncate">
                {milestone.title}
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>Filing as:</span>
                <span className="font-semibold text-foreground">
                  {isFreelancer ? "Freelancer" : "Client"}
                </span>
              </div>
            </div>

            {/* Arbitration Process Notice */}
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 p-3.5 flex items-start gap-3">
              <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-300 space-y-1">
                <p className="font-semibold">Arbitration Guidelines:</p>
                <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-700 dark:text-amber-400">
                  <li>Milestone funds will be locked until resolution.</li>
                  <li>Both parties must pay a $25 arbitration fee within 24h.</li>
                  <li>A neutral Frevia administrator will review all evidence and deliver a fair binding decision.</li>
                </ul>
              </div>
            </div>

            {/* Dispute Reason */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Dispute Reason <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Deliverables do not match contract requirements, Unresponsive..."
                required
                className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#0069D3]/30"
              />
            </div>

            {/* Dispute Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                Detailed Statement <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Provide a thorough explanation of what went wrong, including timelines and communications..."
                required
                className="w-full rounded-xl border border-border bg-card px-3.5 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#0069D3]/30 resize-none"
              />
            </div>

            {/* Select Evidence Files from Contract Shared Files */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">
                  Attach Evidence Files (Max 5)
                </label>
                <span className="text-[11px] text-muted-foreground">
                  {selectedFileIds.length} / 5 selected
                </span>
              </div>

              {sharedFiles.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                  No files have been uploaded to this contract yet.
                </div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {sharedFiles.map((file) => {
                    const isSelected = selectedFileIds.includes(file.id);
                    return (
                      <div
                        key={file.id}
                        onClick={() =>
                          toggleFile(file.id, selectedFileIds, setSelectedFileIds)
                        }
                        className={`flex items-center justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? "border-[#0069D3] bg-[#D0E1F8]/30 dark:bg-[#0069D3]/15"
                            : "border-border/70 bg-card hover:bg-[#F1F0F5]/50"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText className="size-4 text-muted-foreground shrink-0" />
                          <span className="truncate font-medium text-foreground">
                            {file.fileName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div
                            className={`size-4 rounded-md border flex items-center justify-center ${
                              isSelected
                                ? "bg-[#0069D3] border-[#0069D3] text-white"
                                : "border-border"
                            }`}
                          >
                            {isSelected && <CheckCircle2 className="size-3" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <SheetFooter className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="w-full sm:w-auto rounded-full text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmittingDispute}
                size="sm"
                className="w-full sm:w-auto rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
              >
                {isSubmittingDispute ? (
                  <>
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    Opening Dispute...
                  </>
                ) : (
                  <>
                    <Gavel className="mr-1.5 size-3.5" />
                    Confirm & File Dispute
                  </>
                )}
              </Button>
            </SheetFooter>
          </form>
        ) : (
          /* VIEW MODE: Dispute Details & Action Workflow */
          <div className="space-y-6">
            <SheetHeader className="pb-4 border-b border-border/70 text-left space-y-1">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <Gavel className="size-5 text-red-600" />
                  <SheetTitle className="text-lg font-bold text-foreground">
                    Arbitration Case #{dispute?.id ?? "..."}
                  </SheetTitle>
                </div>
                {dispute && (
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold border ${
                      getStatusBadge(dispute.status).className
                    }`}
                  >
                    {getStatusBadge(dispute.status).label}
                  </span>
                )}
              </div>
              <SheetDescription className="text-xs text-muted-foreground">
                Milestone:{" "}
                <strong className="text-foreground">{milestone.title}</strong> •{" "}
                {money(Number(milestone.amount))}
              </SheetDescription>
            </SheetHeader>

            {isLoadingDispute ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2">
                <Loader2 className="size-8 text-[#0069D3] animate-spin" />
                <span className="text-xs text-muted-foreground">
                  Loading arbitration details...
                </span>
              </div>
            ) : !dispute ? (
              <div className="py-12 text-center space-y-3">
                <p className="text-xs text-muted-foreground">
                  No dispute found for this milestone.
                </p>
                <Button
                  size="sm"
                  onClick={() => setActiveMode("CREATE")}
                  className="rounded-full bg-red-600 text-white text-xs"
                >
                  <Gavel className="mr-1.5 size-3.5" />
                  Open a Dispute
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* 1. Arbitration Fee Banner (If user has pending fee) */}
                {currentUserFee && currentUserFee.status === "PENDING" && (
                  <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2.5">
                        <AlertTriangle className="size-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                        <div>
                          <h4 className="text-xs font-bold text-amber-900 dark:text-amber-200">
                            Arbitration Fee Required: $25.00
                          </h4>
                          <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                            Both parties must contribute $25.00 for the arbitration review.
                            {dispute.feeDeadline && (
                              <span className="font-semibold block">
                                Due by: {formatDate(dispute.feeDeadline)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        disabled={isPayingFee}
                        onClick={handlePayFee}
                        className="rounded-full bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-semibold shrink-0"
                      >
                        {isPayingFee ? (
                          <Loader2 className="size-3.5 animate-spin" />
                        ) : (
                          "Pay $25.00 Fee"
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {/* 2. Case Timeline & Fees Status */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="rounded-xl border border-border bg-card p-3 space-y-1">
                    <span className="text-[11px] text-muted-foreground block">
                      Opened By
                    </span>
                    <span className="text-xs font-bold text-foreground truncate block">
                      {isCurrentUserInitiator
                        ? "You"
                        : dispute.openedBy?.email ?? "Other party"}
                    </span>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3 space-y-1">
                    <span className="text-[11px] text-muted-foreground block">
                      Your Fee Status
                    </span>
                    <span
                      className={`text-xs font-bold capitalize ${
                        currentUserFee?.status === "PAID"
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }`}
                    >
                      {currentUserFee?.status ?? "N/A"}
                    </span>
                  </div>
                  <div className="rounded-xl border border-border bg-card p-3 space-y-1 col-span-2 sm:col-span-1">
                    <span className="text-[11px] text-muted-foreground block">
                      Filed On
                    </span>
                    <span className="text-xs font-bold text-foreground">
                      {formatDate(dispute.createdAt)}
                    </span>
                  </div>
                </div>

                {/* 3. Original Claim Details */}
                <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center gap-2 pb-2 border-b border-border/60">
                    <Shield className="size-4 text-[#0069D3]" />
                    <h4 className="text-xs font-bold text-foreground">
                      Dispute Claim
                    </h4>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <span className="text-[11px] text-muted-foreground block">
                        Reason:
                      </span>
                      <p className="text-xs font-semibold text-foreground">
                        {dispute.reason}
                      </p>
                    </div>
                    <div>
                      <span className="text-[11px] text-muted-foreground block">
                        Statement:
                      </span>
                      <p className="text-xs text-foreground/90 whitespace-pre-wrap bg-[#F1F0F5]/50 dark:bg-zinc-900/50 p-3 rounded-xl border border-border/50">
                        {dispute.description}
                      </p>
                    </div>

                    {/* Claim Evidence Files */}
                    {dispute.evidences &&
                      dispute.evidences.filter((e) => e.type === "CLAIM").length >
                        0 && (
                        <div className="pt-2 space-y-1.5">
                          <span className="text-[11px] font-semibold text-muted-foreground">
                            Claim Evidence Files:
                          </span>
                          <div className="space-y-1">
                            {dispute.evidences
                              .filter((e) => e.type === "CLAIM")
                              .map((ev) => (
                                <div
                                  key={ev.id}
                                  className="flex items-center justify-between text-xs bg-muted/40 p-2 rounded-lg border border-border/60"
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <FileText className="size-3.5 text-muted-foreground shrink-0" />
                                    <span className="truncate">
                                      {ev.file?.fileName ?? `Evidence #${ev.id}`}
                                    </span>
                                  </div>
                                  {ev.file?.fileUrl && (
                                    <a
                                      href={ev.file.fileUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-[#0069D3] hover:underline flex items-center gap-1 text-[11px] shrink-0"
                                    >
                                      View <ExternalLink className="size-3" />
                                    </a>
                                  )}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                {/* 4. Respondent Rebuttal Section */}
                <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-border/60">
                    <div className="flex items-center gap-2">
                      <RotateCcw className="size-4 text-purple-600" />
                      <h4 className="text-xs font-bold text-foreground">
                        Respondent Rebuttal
                      </h4>
                    </div>
                    {hasRespondentResponded && (
                      <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="size-3" /> Submitted
                      </span>
                    )}
                  </div>

                  {hasRespondentResponded ? (
                    <div className="space-y-2">
                      {dispute.evidences
                        ?.filter((e) => e.type === "RESPONSE")
                        .map((respEv) => (
                          <div key={respEv.id} className="space-y-2">
                            <p className="text-xs text-foreground/90 whitespace-pre-wrap bg-[#F1F0F5]/50 dark:bg-zinc-900/50 p-3 rounded-xl border border-border/50">
                              {respEv.description ?? "No rebuttal message."}
                            </p>
                            {respEv.file?.fileUrl && (
                              <a
                                href={respEv.file.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#0069D3] hover:underline flex items-center gap-1 text-xs"
                              >
                                <FileText className="size-3.5" />
                                View Evidence: {respEv.file.fileName}
                                <ExternalLink className="size-3" />
                              </a>
                            )}
                          </div>
                        ))}
                    </div>
                  ) : isCurrentUserRespondent &&
                    (dispute.status === "OPEN" ||
                      dispute.status === "WAITING_RESPONSE") ? (
                    /* Respondent Form to submit Rebuttal */
                    <form onSubmit={handleSubmitResponse} className="space-y-3">
                      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-800 dark:text-blue-300">
                        Please provide your rebuttal and attach any supporting project
                        files. You can submit only once.
                      </div>
                      <textarea
                        value={responseDescription}
                        onChange={(e) => setResponseDescription(e.target.value)}
                        rows={3}
                        placeholder="State your side of the dispute clearly..."
                        required
                        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#0069D3]/30 resize-none"
                      />

                      {/* Pick evidence files */}
                      {sharedFiles.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[11px] font-semibold text-muted-foreground">
                            Attach files as rebuttal evidence ({responseFileIds.length}/5):
                          </span>
                          <div className="space-y-1 max-h-32 overflow-y-auto">
                            {sharedFiles.map((file) => {
                              const isChecked = responseFileIds.includes(file.id);
                              return (
                                <div
                                  key={file.id}
                                  onClick={() =>
                                    toggleFile(
                                      file.id,
                                      responseFileIds,
                                      setResponseFileIds,
                                    )
                                  }
                                  className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer ${
                                    isChecked
                                      ? "border-[#0069D3] bg-[#D0E1F8]/30"
                                      : "border-border/60 hover:bg-muted/40"
                                  }`}
                                >
                                  <span className="truncate">{file.fileName}</span>
                                  {isChecked && (
                                    <CheckCircle2 className="size-3.5 text-[#0069D3]" />
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      <Button
                        type="submit"
                        disabled={isSubmittingResponse}
                        size="sm"
                        className="w-full rounded-full bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-semibold"
                      >
                        {isSubmittingResponse ? (
                          <>
                            <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          "Submit Rebuttal"
                        )}
                      </Button>
                    </form>
                  ) : (
                    <div className="rounded-xl border border-dashed border-border/80 p-4 text-center text-xs text-muted-foreground">
                      Awaiting response from respondent.
                    </div>
                  )}
                </div>

                {/* 5. Proposed Decision & Review Actions */}
                {(dispute.status === "DECISION_MADE" ||
                  dispute.status === "REVIEW_REQUESTED" ||
                  dispute.status === "FINALIZED") && (
                  <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-border/60">
                      <div className="flex items-center gap-2">
                        <Gavel className="size-4 text-indigo-600" />
                        <h4 className="text-xs font-bold text-foreground">
                          {dispute.status === "FINALIZED"
                            ? "Final Resolution"
                            : "Arbitrator Proposed Resolution"}
                        </h4>
                      </div>
                      {dispute.decisionAt && (
                        <span className="text-[11px] text-muted-foreground">
                          {formatDate(dispute.decisionAt)}
                        </span>
                      )}
                    </div>

                    {/* Split Allocation Display */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl bg-blue-500/10 border border-blue-500/20 p-3 text-center space-y-1">
                        <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">
                          Client Refund
                        </span>
                        <div className="text-base font-extrabold text-blue-900 dark:text-blue-100">
                          {money(dispute.clientAmount)}
                        </div>
                      </div>
                      <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center space-y-1">
                        <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                          Freelancer Payout
                        </span>
                        <div className="text-base font-extrabold text-emerald-900 dark:text-emerald-100">
                          {money(dispute.freelancerAmount)}
                        </div>
                      </div>
                    </div>

                    {dispute.decisionReason && (
                      <div className="space-y-1">
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          Arbitrator Notes:
                        </span>
                        <p className="text-xs text-foreground/90 whitespace-pre-wrap bg-[#F1F0F5]/50 dark:bg-zinc-900/50 p-3 rounded-xl border border-border/50">
                          {dispute.decisionReason}
                        </p>
                      </div>
                    )}

                    {/* Both Parties Review Status */}
                    {dispute.decisionReviews && dispute.decisionReviews.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <span className="text-[11px] font-semibold text-muted-foreground">
                          Parties Review Status:
                        </span>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          {dispute.decisionReviews.map((rev) => (
                            <div
                              key={rev.id}
                              className="rounded-lg border border-border/70 p-2 space-y-0.5"
                            >
                              <span className="text-[10px] text-muted-foreground block">
                                {rev.userId === currentUserId
                                  ? "You"
                                  : "Other Party"}
                              </span>
                              <span
                                className={`font-bold ${
                                  rev.response === "ACCEPTED"
                                    ? "text-emerald-600"
                                    : "text-red-600"
                                }`}
                              >
                                {rev.response}
                              </span>
                              {rev.reason && (
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {rev.reason}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action buttons when DECISION_MADE and current user hasn't voted yet */}
                    {dispute.status === "DECISION_MADE" && !currentUserReview && (
                      <div className="pt-2 border-t border-border/60 space-y-3">
                        {!showRejectInput ? (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => setShowRejectInput(true)}
                              className="rounded-full text-xs text-red-600 border-red-200 hover:bg-red-50"
                            >
                              Reject & Request Review
                            </Button>
                            <Button
                              type="button"
                              disabled={isSubmittingReview}
                              size="sm"
                              onClick={() => handleReviewDecision("ACCEPTED")}
                              className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                            >
                              {isSubmittingReview ? (
                                <Loader2 className="size-3.5 animate-spin" />
                              ) : (
                                "Accept Proposal"
                              )}
                            </Button>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <textarea
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              rows={2}
                              placeholder="Please explain why you reject this proposal for the secondary review..."
                              className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-red-500/30 resize-none"
                            />
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setShowRejectInput(false)}
                                className="rounded-full text-xs"
                              >
                                Cancel
                              </Button>
                              <Button
                                type="button"
                                disabled={isSubmittingReview}
                                size="sm"
                                onClick={() => handleReviewDecision("REJECTED")}
                                className="rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
                              >
                                {isSubmittingReview ? (
                                  <Loader2 className="size-3.5 animate-spin" />
                                ) : (
                                  "Confirm Rejection"
                                )}
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <SheetFooter className="pt-4 border-t border-border flex justify-end">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="rounded-full text-xs"
              >
                Close
              </Button>
            </SheetFooter>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
