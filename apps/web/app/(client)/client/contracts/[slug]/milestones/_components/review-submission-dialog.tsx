"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
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
import { useActionPermission } from "@/hooks/use-action-permission";
import { toEndOfDayIso } from "@/lib/format";
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
  const t = useTranslations("milestoneWorkspace.reviewDialog");
  const tCommon = useTranslations("common");
  const format = useFormatter();
  const { can } = useActionPermission();

  const formatDate = (date: string | Date | null) => {
    if (!date) return t("notAvailable");
    return format.dateTime(new Date(date), {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };
  const [showChangesForm, setShowChangesForm] = useState(false);
  const [changeRequestMessage, setChangeRequestMessage] = useState("");
  const [changeRequestDueDate, setChangeRequestDueDate] = useState("");
  const [isApproving, setIsApproving] = useState(false);
  const [isRequestingChanges, setIsRequestingChanges] = useState(false);

  const canApprove = can("PATCH", "/api/contracts/:contractId/milestones/:milestoneId/submissions/:id/approve");
  const canRequestChanges = can("PATCH", "/api/contracts/:contractId/milestones/:milestoneId/submissions/:id/request-changes");

  if (!submission) return null;

  const freelancerFee = Math.round(milestoneAmount * 0.05 * 100) / 100;
  const freelancerNetPayout =
    Math.round((milestoneAmount - freelancerFee) * 100) / 100;

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await contractApiRequest.approveSubmission(
        contractId,
        milestoneId,
        submission.id,
      );

      toastSuccess({
        message: t("approvedToast", {
          amount: `$${freelancerNetPayout.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
        }),
      });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["client-contract-milestones", contractId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["client-contract-detail", contractId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["contracts-list"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["milestone-detail", contractId, milestoneId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["milestone-submissions", contractId, milestoneId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["client-transactions"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["freelancer-transactions"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["transactions-summary"],
        }),
        queryClient.invalidateQueries({
          queryKey: ["transactions"],
        }),
      ]);

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : t("approveFailed"),
      });
    } finally {
      setIsApproving(false);
    }
  };

  const handleRequestChanges = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!changeRequestMessage.trim()) {
      toastError({ message: t("notesRequired") });
      return;
    }

    let formattedDueDate: string | undefined = undefined;
    if (changeRequestDueDate) {
      const iso = toEndOfDayIso(changeRequestDueDate);
      if (new Date(iso) <= new Date()) {
        toastError({ message: t("dueDateFuture") });
        return;
      }
      formattedDueDate = iso;
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
      toastSuccess({ message: t("changesRequested") });

      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: ["client-contract-milestones", contractId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["client-contract-detail", contractId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["milestone-detail", contractId, milestoneId],
        }),
        queryClient.invalidateQueries({
          queryKey: ["milestone-submissions", contractId, milestoneId],
        }),
      ]);

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : t("requestFailed"),
      });
    } finally {
      setIsRequestingChanges(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        closeLabel={tCommon("close")}
        className="w-full sm:max-w-lg md:max-w-xl overflow-y-auto p-6 flex flex-col justify-between font-sans border-l border-border bg-background shadow-2xl z-50"
      >
        <div>
          <SheetHeader className="p-0 pb-4 border-b border-border/60">
            <div className="flex items-center gap-2 text-[#0069D3]">
              <div className="flex size-9 items-center justify-center rounded-xl bg-[#0069D3]/10">
                <FileCheck className="size-5" />
              </div>
              <SheetTitle className="text-lg font-bold text-foreground">
                {t("title")}
              </SheetTitle>
            </div>
            <SheetDescription className="text-xs text-muted-foreground mt-1">
              {t("milestoneSummary", {
                title: milestoneTitle,
                amount: `$${milestoneAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
              })}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-5 space-y-5 text-xs text-foreground">
            {/* Submission Time Info */}
            <div className="flex items-center gap-2 rounded-xl bg-muted/40 p-3 text-muted-foreground">
              <Calendar className="size-4 shrink-0 text-[#0069D3]" />
              <span>
                {t("submittedOn", { date: formatDate(submission.submittedAt) })}
              </span>
            </div>

            {/* Freelancer Notes */}
            <div className="space-y-1.5">
              <h4 className="font-bold uppercase tracking-wider text-muted-foreground text-[11px]">
                {t("notesHeading")}
              </h4>
              <div className="rounded-xl border border-border/70 bg-card p-4 leading-relaxed whitespace-pre-wrap">
                {submission.message || t("noNotes")}
              </div>
            </div>

            {/* Links */}
            {submission.links && submission.links.length > 0 && (
              <div className="space-y-1.5">
                <h4 className="font-bold uppercase tracking-wider text-muted-foreground text-[11px]">
                  {t("linksHeading")}
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
                  {t("filesHeading")}
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
                          {item.file?.fileName ||
                            t("fileFallback", { id: item.fileId })}
                        </span>
                      </div>
                      {item.file?.fileUrl && (
                        <a
                          href={item.file.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#0069D3] hover:underline p-1 ml-2 shrink-0 inline-flex items-center gap-1"
                          title={t("downloadTitle")}
                        >
                          <Download className="size-3.5" />
                          <span>{t("download")}</span>
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
                    {t("changesLabel")} <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={changeRequestMessage}
                    onChange={(e) => setChangeRequestMessage(e.target.value)}
                    placeholder={t("changesPlaceholder")}
                    className="mt-1.5 w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground/60 focus:border-[#0069D3] focus:outline-none focus:ring-1 focus:ring-[#0069D3] resize-none leading-relaxed"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground block">
                    {t("dueDateLabel")}
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
                    {t("back")}
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
                    {t("submitRevision")}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>

        {!showChangesForm && (
          <div className="mt-6 space-y-4">
            <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t("grossMilestone")}
                </span>
                <span className="font-mono font-semibold text-foreground">
                  ${milestoneAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {t("freelancerFee")}
                </span>
                <span className="font-mono text-muted-foreground">
                  -${freelancerFee.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="pt-1.5 border-t border-border/60 flex items-center justify-between font-bold">
                <span>{t("netRelease")}</span>
                <span className="font-mono text-emerald-600 dark:text-emerald-400">
                  ${freelancerNetPayout.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            <SheetFooter className="pt-4 border-t border-border flex flex-col sm:flex-row items-center justify-end gap-2">
              {canRequestChanges && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowChangesForm(true)}
                  className="w-full sm:w-auto rounded-xl text-xs border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-400 dark:hover:bg-amber-950/30 cursor-pointer"
                >
                  <RotateCcw className="mr-1.5 size-3.5" />
                  {t("requestChanges")}
                </Button>
              )}

              {canApprove && (
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
                  {t("approveRelease", {
                    amount: `$${freelancerNetPayout.toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
                  })}
                </Button>
              )}
            </SheetFooter>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

