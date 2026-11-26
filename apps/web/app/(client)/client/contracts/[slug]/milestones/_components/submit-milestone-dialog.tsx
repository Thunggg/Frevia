"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Link2,
  Loader2,
  Lock,
  Plus,
  Send,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@repo/ui/components/shadcn/alert-dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@repo/ui/components/shadcn/sheet";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { contractApiRequest, extractContractData } from "@/apiRequests/contract";
import { useActionPermission } from "@/hooks/use-action-permission";
import { ApiFail } from "@/lib/http";
import type { MilestoneFileType, MilestoneType } from "@shared/types";

interface SubmitMilestoneDialogProps {
  contractId: number;
  milestone: MilestoneType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  contractExpiresAt?: string | Date | null;
}

export function SubmitMilestoneDialog({
  contractId,
  milestone,
  open,
  onOpenChange,
  onSuccess,
  contractExpiresAt,
}: SubmitMilestoneDialogProps) {
  const queryClient = useQueryClient();
  const t = useTranslations("milestoneWorkspace.submitDialog");
  const tCommon = useTranslations("common");
  const { can } = useActionPermission();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canUploadFile = can("POST", "/api/contracts/:contractId/milestones/:milestoneId/files");
  const canDeleteFile = can("DELETE", "/api/contracts/:contractId/milestones/:milestoneId/files/:fileId");
  const canSubmit = can("POST", "/api/contracts/:contractId/milestones/:milestoneId/submissions");

  const [message, setMessage] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [links, setLinks] = useState<string[]>([]);
  const [milestoneFiles, setMilestoneFiles] = useState<MilestoneFileType[]>([]);
  const [selectedFileIds, setSelectedFileIds] = useState<number[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fileToRemove, setFileToRemove] = useState<MilestoneFileType | null>(null);
  const [isRemovingFile, setIsRemovingFile] = useState(false);

  const isContractExpired = Boolean(
    contractExpiresAt && new Date(contractExpiresAt).getTime() <= Date.now()
  );

  useEffect(() => {
    if (open && milestone) {
      let cancelled = false;
      setIsLoadingFiles(true);
      contractApiRequest
        .getMilestoneFiles(contractId, milestone.id)
        .then((res) => {
          if (cancelled) return;
          const files = (extractContractData(res) || []) as MilestoneFileType[];
          setMilestoneFiles(files);
          setSelectedFileIds(files.map((f) => f.id));
        })
        .catch(() => { })
        .finally(() => {
          if (!cancelled) setIsLoadingFiles(false);
        });

      return () => {
        cancelled = true;
      };
    }
  }, [open, contractId, milestone]);

  if (!milestone) return null;

  const isResubmission = milestone.status === "CHANGES_REQUESTED";

  const normalizeUrl = (raw: string): string | null => {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    const candidate = /^https?:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;
    try {
      const parsed = new URL(candidate);
      if (
        (parsed.protocol === "http:" || parsed.protocol === "https:") &&
        (parsed.hostname.includes(".") || parsed.hostname === "localhost")
      ) {
        return parsed.toString();
      }
      return null;
    } catch {
      return null;
    }
  };

  const handleAddLink = () => {
    const trimmed = linkInput.trim();
    if (!trimmed) return;

    const normalized = normalizeUrl(trimmed);
    if (!normalized) {
      toastError({ message: t("invalidUrl") });
      return;
    }

    if (!links.includes(normalized)) {
      setLinks([...links, normalized]);
    }
    setLinkInput("");
  };

  const handleRemoveLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toastError({ message: t("fileTooLarge") });
      return;
    }

    setIsUploadingFile(true);
    try {
      const res = await contractApiRequest.uploadMilestoneFile(
        contractId,
        milestone.id,
        file,
      );
      const data = extractContractData(res) as MilestoneFileType;
      setMilestoneFiles((prev) => [...prev, data]);
      setSelectedFileIds((prev) => [...prev, data.id]);
      toastSuccess({ message: t("uploaded", { name: file.name }) });
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : t("uploadFailed"),
      });
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleConfirmRemoveFile = async () => {
    if (!fileToRemove || !milestone) return;
    if (fileToRemove.isSubmitted) {
      toastError({ message: t("submittedCannotDelete") });
      setFileToRemove(null);
      return;
    }
    setIsRemovingFile(true);
    try {
      await contractApiRequest.deleteMilestoneFile(
        contractId,
        milestone.id,
        fileToRemove.id,
      );
      setMilestoneFiles((prev) => prev.filter((f) => f.id !== fileToRemove.id));
      setSelectedFileIds((prev) => prev.filter((id) => id !== fileToRemove.id));
      toastSuccess({ message: t("removedFile") });
      setFileToRemove(null);
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : t("removeFileFailed"),
      });
    } finally {
      setIsRemovingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isContractExpired) {
      toastError({
        message: t("contractExpiredWarning"),
      });
      return;
    }

    const finalLinks = [...links];
    if (linkInput.trim()) {
      const normalizedPending = normalizeUrl(linkInput);
      if (!normalizedPending) {
        toastError({
          message: t("invalidUrl"),
        });
        return;
      }
      if (!finalLinks.includes(normalizedPending)) {
        finalLinks.push(normalizedPending);
      }
    }

    if (
      !message.trim() &&
      finalLinks.length === 0 &&
      selectedFileIds.length === 0
    ) {
      toastError({
        message: t("missingContent"),
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await contractApiRequest.submitMilestone(contractId, milestone.id, {
        message: message.trim() || undefined,
        links: finalLinks,
        fileIds: selectedFileIds,
      });

      toastSuccess({
        message: isResubmission ? t("resubmitted") : t("submitted"),
      });

      setMessage("");
      setLinkInput("");
      setLinks([]);

      await queryClient.invalidateQueries({
        queryKey: ["client-contract-detail", contractId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-milestones", contractId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["milestone-detail", contractId, milestone.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["milestone-submissions", contractId, milestone.id],
      });
      await queryClient.invalidateQueries({
        queryKey: ["milestone-files", contractId, milestone.id],
      });

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : t("submitFailed"),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        closeLabel={tCommon("close")}
        className="w-full sm:max-w-md overflow-y-auto p-6 flex flex-col justify-between font-sans border-l border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-2xl z-50"
      >
        <div>
          <SheetHeader className="p-0 pb-4 border-b border-zinc-100 dark:border-zinc-800/80">
            <div className="flex items-center gap-2.5 text-[#0069D3]">
              <div className="flex size-9 items-center justify-center rounded-lg bg-[#0069D3]/10">
                <Upload className="size-4" />
              </div>
              <div>
                <SheetTitle className="text-base font-bold text-zinc-950 dark:text-zinc-50">
                  {isResubmission ? t("titleResubmit") : t("titleSubmit")}
                </SheetTitle>
                <SheetDescription className="text-xs text-zinc-400 mt-0.5">
                  {t("milestoneSummary", {
                    title: milestone.title,
                    amount: `$${Number(milestone.amount).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}`,
                  })}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          {isContractExpired && (
            <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
              {t("contractExpiredWarning")}
            </div>
          )}

          <form id="submit-milestone-form" onSubmit={handleSubmit} className="space-y-4 pt-4">
            {/* Notes / Message */}
            <div>
              <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block mb-1.5">
                {t("notesLabel")}
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder={t("notesPlaceholder")}
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-[#0069D3] focus:outline-hidden resize-none leading-relaxed"
              />
            </div>

            {/* External Links */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                {t("linksLabel")}
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Link2 className="absolute left-2.5 top-2.5 size-3.5 text-zinc-400" />
                  <input
                    type="text"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    placeholder="https://github.com/..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddLink();
                      }
                    }}
                    className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 py-1.5 pl-8 pr-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-[#0069D3] focus:outline-hidden"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddLink}
                  className="rounded-lg text-xs shrink-0 cursor-pointer h-8 px-2.5 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                >
                  <Plus className="mr-1 size-3" />
                  {t("addLink")}
                </Button>
              </div>

              {links.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {links.map((link, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-800 dark:text-zinc-200"
                    >
                      <a
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="truncate max-w-[280px] text-[#0069D3] hover:underline"
                      >
                        {link}
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemoveLink(idx)}
                        className="text-zinc-400 hover:text-rose-500 cursor-pointer p-0.5"
                        title={t("removeLink")}
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Attached Files */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                  {t("filesLabel")}
                </label>
                {canUploadFile && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      onChange={handleFileSelect}
                      className="hidden"
                      disabled={isContractExpired || isUploadingFile}
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={isUploadingFile || isContractExpired}
                      onClick={() => fileInputRef.current?.click()}
                      className="rounded-lg text-xs flex items-center gap-1.5 border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 cursor-pointer h-7 px-2"
                    >
                      {isUploadingFile ? (
                        <Loader2 className="size-3 animate-spin" />
                      ) : (
                        <Upload className="size-3" />
                      )}
                      <span>{t("uploadDeliverableFile")}</span>
                    </Button>
                  </>
                )}
              </div>

              {isLoadingFiles ? (
                <div className="py-3 text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Loading files...</span>
                </div>
              ) : milestoneFiles.length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  <p className="text-[11px] text-muted-foreground">
                    {t("selectFilesHint")}
                  </p>
                  {milestoneFiles.map((f) => {
                    const isSelected = selectedFileIds.includes(f.id);
                    const isSubmitted = Boolean(f.isSubmitted);
                    return (
                      <div
                        key={f.id}
                        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition-colors ${isSelected
                          ? "border-[#0069D3]/40 bg-blue-50/40 dark:border-blue-900/40 dark:bg-blue-950/20"
                          : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60"
                          }`}
                      >
                        <label className="flex items-center gap-2.5 truncate max-w-[270px] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedFileIds((prev) => [...prev, f.id]);
                              } else {
                                setSelectedFileIds((prev) =>
                                  prev.filter((id) => id !== f.id),
                                );
                              }
                            }}
                            className="size-3.5 rounded border-zinc-300 text-[#0069D3] focus:ring-0 cursor-pointer"
                          />
                          <FileText className="size-3.5 text-zinc-400 shrink-0" />
                          <span className="truncate font-medium text-foreground">
                            {f.fileName}
                          </span>
                        </label>

                        <div className="flex items-center gap-1.5 shrink-0 ml-2">
                          {isSubmitted ? (
                            <span className="inline-flex items-center gap-1 rounded bg-zinc-200/70 px-1.5 py-0.5 text-[10px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                              <Lock className="size-2.5" />
                              {t("submittedBadge")}
                            </span>
                          ) : canDeleteFile ? (
                            <button
                              type="button"
                              onClick={() => setFileToRemove(f)}
                              className="text-zinc-400 hover:text-rose-500 cursor-pointer p-0.5"
                              title={t("removeFile")}
                            >
                              <Trash2 className="size-3.5" />
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic py-1">
                  {t("noUploadedFiles")}
                </p>
              )}
            </div>
          </form>
        </div>

        <SheetFooter className="pt-4 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting || isUploadingFile}
            className="rounded-lg text-xs h-8 px-3 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 cursor-pointer"
          >
            {tCommon("cancel")}
          </Button>
          {canSubmit && (
            <Button
              type="submit"
              form="submit-milestone-form"
              size="sm"
              disabled={isSubmitting || isUploadingFile || isContractExpired}
              className="rounded-lg bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold h-8 px-4 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <Send className="mr-1.5 size-3.5" />
              )}
              {isResubmission ? t("resubmitAction") : t("submitAction")}
            </Button>
          )}
        </SheetFooter>

        {/* Confirm Remove Attachment Dialog */}
        <AlertDialog
          open={Boolean(fileToRemove)}
          onOpenChange={(open) => {
            if (!open && !isRemovingFile) {
              setFileToRemove(null);
            }
          }}
        >
          <AlertDialogContent className="max-w-sm rounded-[24px] border border-border bg-background p-5 shadow-2xl font-sans">
            <div className="flex flex-col gap-3">
              <AlertDialogTitle className="text-base font-bold text-foreground">
                {t("removeFileTitle")}
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
                {t("removeFileHint", {
                  name: fileToRemove?.fileName ?? "",
                })}
              </AlertDialogDescription>
              <div className="mt-2 flex flex-col gap-2">
                <Button
                  variant="destructive"
                  disabled={isRemovingFile}
                  onClick={() => void handleConfirmRemoveFile()}
                  className="w-full rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
                >
                  {isRemovingFile ? (
                    <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="mr-1.5 size-3.5" />
                  )}
                  {t("confirmRemove")}
                </Button>
                <AlertDialogCancel
                  disabled={isRemovingFile}
                  className="w-full rounded-full text-xs cursor-pointer"
                >
                  {tCommon("cancel")}
                </AlertDialogCancel>
              </div>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </SheetContent>
    </Sheet>
  );
}
