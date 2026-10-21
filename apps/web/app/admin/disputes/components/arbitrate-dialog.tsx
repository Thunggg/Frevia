"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { Button } from "@repo/ui/components/shadcn/button";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Separator } from "@repo/ui/components/shadcn/separator";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import {
  CheckCircle2,
  ExternalLink,
  FileText,
  Gavel,
  Loader2,
  Scale,
  Shield,
  User,
  XCircle,
} from "lucide-react";
import { disputeApiRequest } from "@/apiRequests/dispute";
import { ApiFail } from "@/lib/http";
import type { DisputeDetailType } from "@shared/types";

interface ArbitrateDialogProps {
  dispute: DisputeDetailType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function ArbitrateDialog({
  dispute,
  open,
  onOpenChange,
  onSuccess,
}: ArbitrateDialogProps) {
  const milestoneAmount = Number(dispute?.milestone?.amount ?? 0);

  // Form states for ruling
  const [freelancerAmount, setFreelancerAmount] = useState<number>(0);
  const [clientAmount, setClientAmount] = useState<number>(0);
  const [decisionReason, setDecisionReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (dispute) {
      if (dispute.freelancerAmount !== null && dispute.freelancerAmount !== undefined) {
        setFreelancerAmount(Number(dispute.freelancerAmount));
        setClientAmount(Number(dispute.clientAmount ?? 0));
      } else {
        // Default 50/50 split
        const half = Number((milestoneAmount / 2).toFixed(2));
        setFreelancerAmount(half);
        setClientAmount(Number((milestoneAmount - half).toFixed(2)));
      }
      setDecisionReason(dispute.decisionReason || "");
    }
  }, [dispute, milestoneAmount]);

  if (!dispute) return null;

  const currentTotal = Number((freelancerAmount + clientAmount).toFixed(2));
  const isSplitValid = currentTotal === Number(milestoneAmount.toFixed(2));

  // Preset split helpers
  const handleSetSplit = (type: "CLIENT_100" | "HALF" | "FREELANCER_100") => {
    if (type === "CLIENT_100") {
      setClientAmount(milestoneAmount);
      setFreelancerAmount(0);
    } else if (type === "FREELANCER_100") {
      setFreelancerAmount(milestoneAmount);
      setClientAmount(0);
    } else {
      const half = Number((milestoneAmount / 2).toFixed(2));
      setFreelancerAmount(half);
      setClientAmount(Number((milestoneAmount - half).toFixed(2)));
    }
  };

  const handleMakeDecision = async (isFinal: boolean) => {
    if (!isSplitValid) {
      toastError({
        message: `Total split must equal milestone amount: ${money(milestoneAmount)} (Current: ${money(currentTotal)})`,
      });
      return;
    }

    if (!decisionReason.trim() || decisionReason.trim().length < 5) {
      toastError({
        message: "Please provide an explanation for this ruling (minimum 5 characters).",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        freelancerAmount,
        clientAmount,
        decisionReason: decisionReason.trim(),
      };

      if (isFinal) {
        await disputeApiRequest.adminFinalDecision(dispute.id, payload);
        toastSuccess({
          message: "Final binding decision issued! Dispute is now finalized.",
        });
      } else {
        await disputeApiRequest.adminMakeDecision(dispute.id, payload);
        toastSuccess({
          message: "Proposed decision issued to both parties for review.",
        });
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      if (error instanceof ApiFail) {
        toastError({ message: error.message });
      } else {
        toastError({ message: "Failed to submit decision." });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const canMakeProposedDecision =
    dispute.status === "OPEN" ||
    dispute.status === "WAITING_RESPONSE" ||
    dispute.status === "UNDER_REVIEW";

  const canMakeFinalDecision =
    dispute.status === "DECISION_MADE" ||
    dispute.status === "REVIEW_REQUESTED";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto font-sans">
        <DialogHeader className="space-y-1 text-left">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Scale className="size-5 text-[#0069D3]" />
              <DialogTitle className="text-lg font-bold text-foreground">
                Arbitration Case #{dispute.id}
              </DialogTitle>
            </div>
            <Badge variant="outline" className="font-semibold">
              {dispute.status}
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Milestone: <strong className="text-foreground">{dispute.milestone?.title}</strong> •{" "}
            Amount: <strong className="text-foreground">{money(milestoneAmount)}</strong> •{" "}
            Filed: <strong className="text-foreground">{formatDate(dispute.createdAt)}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* 1. Parties & Fees Overview */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="rounded-xl border border-border bg-card p-3 space-y-0.5">
              <span className="text-[11px] text-muted-foreground block">Client</span>
              <span className="font-bold text-foreground truncate block">
                {dispute.openedBy?.email ?? "N/A"}
              </span>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 space-y-0.5">
              <span className="text-[11px] text-muted-foreground block">Freelancer</span>
              <span className="font-bold text-foreground truncate block">
                {dispute.respondent?.email ?? "N/A"}
              </span>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 space-y-0.5">
              <span className="text-[11px] text-muted-foreground block">Arbitration Fee</span>
              <span className="font-bold text-foreground block">
                {money(dispute.arbitrationFee)} each
              </span>
            </div>
            <div className="rounded-xl border border-border bg-card p-3 space-y-0.5">
              <span className="text-[11px] text-muted-foreground block">Fee Statuses</span>
              <span className="font-semibold block text-emerald-600">
                {dispute.fees?.filter((f) => f.status === "PAID").length ?? 0}/
                {dispute.fees?.length ?? 2} Paid
              </span>
            </div>
          </div>

          <Separator />

          {/* 2. Claim Statement & Evidence */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Shield className="size-4 text-[#0069D3]" />
              <span>Claim by Initiator</span>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-2 text-xs">
              <div>
                <span className="text-[11px] text-muted-foreground block">Reason:</span>
                <p className="font-semibold text-foreground">{dispute.reason}</p>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground block">Statement:</span>
                <p className="text-foreground/90 whitespace-pre-wrap">{dispute.description}</p>
              </div>

              {/* Claim Evidence Files */}
              {dispute.evidences?.filter((e) => e.type === "CLAIM").length ? (
                <div className="pt-2 space-y-1">
                  <span className="text-[11px] font-semibold text-muted-foreground">
                    Attached Claim Files:
                  </span>
                  <div className="space-y-1">
                    {dispute.evidences
                      .filter((e) => e.type === "CLAIM")
                      .map((ev) => (
                        <div
                          key={ev.id}
                          className="flex items-center justify-between bg-card border border-border/70 p-2 rounded-lg text-xs"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <FileText className="size-3.5 text-muted-foreground shrink-0" />
                            <span className="truncate">{ev.file?.fileName ?? `Evidence #${ev.id}`}</span>
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
              ) : null}
            </div>
          </div>

          {/* 3. Respondent Rebuttal */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <User className="size-4 text-purple-600" />
              <span>Respondent Rebuttal</span>
            </div>
            <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-2 text-xs">
              {dispute.evidences?.filter((e) => e.type === "RESPONSE").length ? (
                dispute.evidences
                  .filter((e) => e.type === "RESPONSE")
                  .map((ev) => (
                    <div key={ev.id} className="space-y-2">
                      <p className="text-foreground/90 whitespace-pre-wrap">
                        {ev.description || "No written explanation provided."}
                      </p>
                      {ev.file?.fileUrl && (
                        <a
                          href={ev.file.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#0069D3] hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <FileText className="size-3.5" />
                          View File: {ev.file.fileName}
                          <ExternalLink className="size-3" />
                        </a>
                      )}
                    </div>
                  ))
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Respondent has not submitted a rebuttal yet.
                </p>
              )}
            </div>
          </div>

          {/* 4. Parties Reviews on Previous Ruling (if any) */}
          {dispute.decisionReviews && dispute.decisionReviews.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                <CheckCircle2 className="size-4 text-amber-600" />
                <span>Parties Feedback on Proposed Ruling</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {dispute.decisionReviews.map((rev) => (
                  <div key={rev.id} className="rounded-xl border border-border p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        User #{rev.userId}
                      </span>
                      <Badge
                        variant={rev.response === "ACCEPTED" ? "default" : "destructive"}
                        className="text-[10px]"
                      >
                        {rev.response}
                      </Badge>
                    </div>
                    {rev.reason && (
                      <p className="text-[11px] text-foreground/80 italic">
                        &quot;{rev.reason}&quot;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />

          {/* 5. Arbitration Ruling Form */}
          {dispute.status === "FINALIZED" ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-xs space-y-2">
              <div className="flex items-center gap-2 text-emerald-700 font-bold">
                <CheckCircle2 className="size-4" />
                <span>Case Finalized & Settled</span>
              </div>
              <p className="text-foreground/90">
                Client Refund: <strong>{money(dispute.clientAmount)}</strong> • Freelancer Payout:{" "}
                <strong>{money(dispute.freelancerAmount)}</strong>
              </p>
              {dispute.decisionReason && (
                <p className="text-muted-foreground text-[11px]">
                  Reason: {dispute.decisionReason}
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-border bg-card p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Gavel className="size-4 text-[#0069D3]" />
                  <h4 className="text-sm font-bold text-foreground">
                    {canMakeProposedDecision
                      ? "Issue Proposed Ruling"
                      : "Issue Final Binding Ruling"}
                  </h4>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSetSplit("CLIENT_100")}
                    className="text-[11px] px-2 py-1 rounded-md border border-border hover:bg-muted font-medium"
                  >
                    100% Client
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetSplit("HALF")}
                    className="text-[11px] px-2 py-1 rounded-md border border-border hover:bg-muted font-medium"
                  >
                    50 / 50
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetSplit("FREELANCER_100")}
                    className="text-[11px] px-2 py-1 rounded-md border border-border hover:bg-muted font-medium"
                  >
                    100% Freelancer
                  </button>
                </div>
              </div>

              {/* Split Inputs */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">
                    Client Refund Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={milestoneAmount}
                    value={clientAmount}
                    onChange={(e) => setClientAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#0069D3]/30"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-foreground">
                    Freelancer Payout Amount ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max={milestoneAmount}
                    value={freelancerAmount}
                    onChange={(e) => setFreelancerAmount(Number(e.target.value))}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#0069D3]/30"
                  />
                </div>
              </div>

              {/* Split Validation Notice */}
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">
                  Total Split: <strong>{money(currentTotal)}</strong> / {money(milestoneAmount)}
                </span>
                {!isSplitValid && (
                  <span className="text-red-500 font-semibold flex items-center gap-1">
                    <XCircle className="size-3" /> Sum must equal {money(milestoneAmount)}
                  </span>
                )}
              </div>

              {/* Decision Reason */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-foreground">
                  Arbitration Findings & Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={decisionReason}
                  onChange={(e) => setDecisionReason(e.target.value)}
                  rows={3}
                  placeholder="State the rationale for this split decision for both client and freelancer..."
                  className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#0069D3]/30 resize-none"
                />
              </div>

              {/* Action Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                {canMakeProposedDecision && (
                  <Button
                    type="button"
                    disabled={isSubmitting || !isSplitValid}
                    onClick={() => handleMakeDecision(false)}
                    className="rounded-full bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-semibold"
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    ) : (
                      <Gavel className="mr-1.5 size-3.5" />
                    )}
                    Issue Proposed Decision
                  </Button>
                )}

                {canMakeFinalDecision && (
                  <Button
                    type="button"
                    disabled={isSubmitting || !isSplitValid}
                    onClick={() => handleMakeDecision(true)}
                    className="rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-1.5 size-3.5" />
                    )}
                    Issue Final Ruling & Finalize
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
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-full text-xs"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
