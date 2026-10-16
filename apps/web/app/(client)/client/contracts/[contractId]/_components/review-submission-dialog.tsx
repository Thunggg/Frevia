"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
  CalendarDays,
  CheckCircle2,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  Loader2,
  RotateCcw,
} from "@/components/icons";
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
        message: `Milestone approved and payment of $${milestoneAmount.toLocaleString()} released!`,
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

    setIsRequestingChanges(true);
    try {
      await contractApiRequest.requestChanges(
        contractId,
        milestoneId,
        submission.id,
        {
          changeRequestMessage: changeRequestMessage.trim(),
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
                <FileCheck2 className="size-5" />
              </div>
              <SheetTitle className="text-lg font-bold text-foreground">
                Review Work Submission
              </SheetTitle>
            </div>
            <SheetDescription className="mt-1 text-xs text-muted-foreground">
              Milestone: <span className="font-semibold text-foreground">{milestoneTitle}</span> (
              ${milestoneAmount.toLocaleString()})
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Submission Info */}
            <div className="flex items-center justify-between rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                Submitted {formatDate(submission.submittedAt)}
              </span>
              <span className="rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-medium px-2.5 py-0.5 text-[11px]">
                {submission.status}
              </span>
            </div>

            {/* Submission Message */}
            <div>
              <label className="text-xs font-semibold text-foreground block">
                Freelancer Deliverable Notes
              </label>
              <div className="mt-1.5 rounded-xl border border-border bg-card p-3.5 text-xs text-foreground/90 whitespace-pre-wrap leading-relaxed">
                {submission.message || "No specific message provided."}
              </div>
            </div>

            {/* Deliverable Links */}
            {submission.links && submission.links.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-foreground block">
                  Deliverable Links
                </label>
                <div className="mt-1.5 space-y-1.5">
                  {submission.links.map((link, idx) => (
                    <a
                      key={idx}
                      href={link}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-xs text-[#0069D3] hover:underline"
                    >
                      <span className="truncate">{link}</span>
                      <ExternalLink className="size-3.5 shrink-0 ml-2" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Attached Files */}
            {submission.files && submission.files.length > 0 && (
              <div>
                <label className="text-xs font-semibold text-foreground block">
                  Attached Files
                </label>
                <div className="mt-1.5 space-y-1.5">
                  {submission.files.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="size-4 text-muted-foreground" />
                        <span className="truncate">{item.file?.fileName || `File #${item.fileId}`}</span>
                      </div>
                      {item.file?.fileUrl && (
                        <a
                          href={item.file.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#0069D3] hover:text-[#005bb8] p-1"
                          title="Download file"
                        >
                          <Download className="size-3.5" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Changes Request Form Accordion */}
            {showChangesForm && (
              <form onSubmit={handleRequestChanges} className="space-y-3 pt-3 border-t border-border">
                <div>
                  <label className="text-xs font-semibold text-foreground">
                    Feedback & Required Changes <span className="text-red-500">*</span>
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

                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowChangesForm(false)}
                    className="rounded-full text-xs"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isRequestingChanges}
                    className="rounded-full bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold"
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
              className="w-full sm:w-auto rounded-full text-xs border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/30"
            >
              <RotateCcw className="mr-1.5 size-3.5" />
              Request Changes
            </Button>

            <Button
              type="button"
              disabled={isApproving}
              onClick={() => void handleApprove()}
              className="w-full sm:w-auto rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold"
            >
              {isApproving ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="mr-1.5 size-3.5" />
              )}
              Approve & Release ${milestoneAmount.toLocaleString()}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
