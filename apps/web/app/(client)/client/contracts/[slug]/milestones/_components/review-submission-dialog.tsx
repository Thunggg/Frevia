"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CheckCircle2,
  Download,
  ExternalLink,
  FileCheck,
  FileText,
  Loader2,
  RotateCcw,
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
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { contractApiRequest } from "@/apiRequests/contract";
import { ApiFail } from "@/lib/http";
import type { GetSubmissionResponseType } from "@shared/types";

interface ReviewSubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contractId: number;
  milestoneId: number;
  milestoneTitle: string;
  milestoneAmount: number;
  submission: GetSubmissionResponseType | null;
  onSuccess?: () => void;
}

function formatDate(date: string | Date | null) {
  if (!date) return "N/A";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

export function ReviewSubmissionDialog({
  open,
  onOpenChange,
  contractId,
  milestoneId,
  milestoneTitle,
  milestoneAmount,
  submission,
  onSuccess,
}: ReviewSubmissionDialogProps) {
  const queryClient = useQueryClient();
  const [showChangesForm, setShowChangesForm] = useState(false);
  const [changeRequestMessage, setChangeRequestMessage] = useState("");
  const [changeRequestDueDate, setChangeRequestDueDate] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isRequestingChanges, setIsRequestingChanges] = useState(false);

  if (!submission) return null;

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await contractApiRequest.approveSubmission(
        contractId,
        milestoneId,
        submission.id,
      );
      toastSuccess({
        message: `Milestone approved and payment of $${milestoneAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })} released!`,
      });

      await queryClient.invalidateQueries({
        queryKey: ["client-contract-milestones", contractId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-detail", contractId],
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Failed to approve milestone. Please try again.",
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleRequestChanges = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!changeRequestMessage.trim()) {
      toastError({ message: "Please provide notes on the revisions requested." });
      return;
    }

    let formattedDueDate: string | undefined = undefined;
    if (changeRequestDueDate) {
      const d = new Date(changeRequestDueDate);
      d.setHours(23, 59, 59, 999);
      if (d <= new Date()) {
        toastError({ message: "Revision due date must be in the future." });
        return;
      }
      formattedDueDate = d.toISOString();
    }

    setIsRequestingChanges(true);
    try {
      await contractApiRequest.requestChanges(
        contractId,
        milestoneId,
        submission.id,
        {
          changeRequestMessage: changeRequestMessage.trim(),
          changeRequestDueDate: formattedDueDate,
        },
      );
      toastSuccess({ message: "Revisions requested from freelancer." });

      await queryClient.invalidateQueries({
        queryKey: ["client-contract-milestones", contractId],
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Failed to submit revision request. Please try again.",
      });
    } finally {
      setIsRequestingChanges(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg md:max-w-xl overflow-y-auto p-6 flex flex-col justify-between font-sans border-l border-border bg-background shadow-2xl z-50"
      >
        <div>
          <SheetHeader className="p-0 pb-4 border-b border-border/60">
            <div className="flex items-center gap-2 text-[#0069D3]">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#0069D3]/10">
                <FileCheck className="size-5" />
              </div>
              <SheetTitle className="text-lg font-bold text-foreground">
                Review Work Submission
              </SheetTitle>
            </div>
            <SheetDescription className="text-xs text-muted-foreground mt-1">
              Milestone: <strong className="text-foreground">{milestoneTitle}</strong> • Value:{" "}
              <strong className="text-foreground">
                ${milestoneAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </strong>
            </SheetDescription>
          </SheetHeader>

          <div className="mt-5 space-y-5 text-xs text-foreground">
            {/* Submission Time Info */}
            <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-3 text-muted-foreground">
              <Calendar className="size-4 shrink-0 text-[#0069D3]" />
              <span>
                Submitted on: <strong className="text-foreground">{formatDate(submission.submittedAt)}</strong>
              </span>
            </div>

            {/* Freelancer Notes */}
            <div className="space-y-1.5">
              <h4 className="font-bold uppercase tracking-wider text-muted-foreground text-[11px]">
                Deliverable Notes from Freelancer
              </h4>
              <div className="rounded-xl border border-border/70 bg-card p-4 leading-relaxed whitespace-pre-wrap">
                {submission.message || "No written notes provided."}
              </div>
            </div>

            {/* Links */}
            {submission.links && submission.links.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="font-bold uppercase tracking-wider text-muted-foreground text-[11px]">
                  Project / Verification Links
                </h4>
                <div className="space-y-2">
                  {submission.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-3 text-xs text-[#0069D3] hover:underline"
                    >
                      <span className="truncate max-w-[380px]">{link}</span>
                      <ExternalLink className="size-3.5 shrink-0 ml-2" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Files */}
            {submission.files && submission.files.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="font-bold uppercase tracking-wider text-muted-foreground text-[11px]">
                  Attached Deliverable Files
                </h4>
                <div className="space-y-2">
                  {submission.files.map((item) => (
                    <div
                      key={item.fileId}
                      className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-3 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText className="size-4 text-muted-foreground shrink-0" />
                        <span className="truncate font-medium">
                          {item.file?.fileName || `File #${item.fileId}`}
                        </span>
                      </div>
                      {item.file?.fileUrl && (
                        <a
                          href={item.file.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#0069D3] hover:underline p-1 ml-2 shrink-0 inline-flex items-center gap-1"
                          title="Download file"
                        >
                          <Download className="size-3.5" />
                          <span>Download</span>
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Changes Request Form */}
            {showChangesForm && (
              <form onSubmit={handleRequestChanges} className="space-y-3 pt-3 border-t border-border">
                <div>
                  <label className="text-xs font-semibold text-foreground block">
                    Feedback & Required Changes <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={changeRequestMessage}
                    onChange={(e) => setChangeRequestMessage(e.target.value)}
                    placeholder="Explain clearly what changes or adjustments are required before approval..."
                    className="mt-1.5 w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-[#0069D3] focus:outline-none focus:ring-1 focus:ring-[#0069D3] resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block">
                    Revision Target Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
                    value={changeRequestDueDate}
                    onChange={(e) => setChangeRequestDueDate(e.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-border bg-background p-2.5 text-xs text-foreground focus:border-[#0069D3] focus:outline-none focus:ring-1 focus:ring-[#0069D3]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowChangesForm(false)}
                    className="rounded-xl text-xs cursor-pointer"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isRequestingChanges}
                    className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    {isRequestingChanges ? (
                      <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                    ) : (
                      <RotateCcw className="mr-1.5 size-3.5" />
                    )}
                    Submit Revision Request
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {!showChangesForm && (
          <SheetFooter className="mt-8 pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowChangesForm(true)}
              className="w-full sm:w-auto rounded-xl text-xs border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/30 cursor-pointer"
            >
              <RotateCcw className="mr-1.5 size-3.5" />
              Request Changes
            </Button>

            <Button
              type="button"
              disabled={isApproving}
              onClick={() => void handleApprove()}
              className="w-full sm:w-auto rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer"
            >
              {isApproving ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1.5 size-3.5" />
              )}
              Approve & Release ${milestoneAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}

