"use client";

import { useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import {
  Download,
  FileText,
  Loader2,
  Lock,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@repo/ui/components/shadcn/alert-dialog";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { contractApiRequest } from "@/apiRequests/contract";
import { useActionPermission } from "@/hooks/use-action-permission";
import { ApiFail } from "@/lib/http";
import type { MilestoneFileType } from "@shared/types";

interface MilestoneFilesTabProps {
  contractId: number;
  milestoneId: number;
  files: MilestoneFileType[];
  onFilesChanged: () => void;
  isFreelancer?: boolean;
  contractExpiresAt?: string | Date | null;
}

export function MilestoneFilesTab({
  contractId,
  milestoneId,
  files,
  onFilesChanged,
  contractExpiresAt,
}: MilestoneFilesTabProps) {
  const format = useFormatter();
  const t = useTranslations("milestoneWorkspace.files");
  const tCommon = useTranslations("common");
  const { can, isLoading: isPermissionLoading } = useActionPermission();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [fileToDelete, setFileToDelete] = useState<MilestoneFileType | null>(null);

  const isContractExpired = Boolean(
    contractExpiresAt && new Date(contractExpiresAt).getTime() <= Date.now()
  );

  const canViewFiles = can("GET", "/api/contracts/:contractId/milestones/:milestoneId/files");
  const canUploadFile = can("POST", "/api/contracts/:contractId/milestones/:milestoneId/files");
  const canDeleteFile = can("DELETE", "/api/contracts/:contractId/milestones/:milestoneId/files/:fileId");

  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return "";
    const d = new Date(date);
    return format.dateTime(d, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isContractExpired) {
      toastError({ message: t("contractExpiredUploadDisabled") });
      return;
    }
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 25 * 1024 * 1024) {
      toastError({ message: t("fileTooLarge") });
      return;
    }

    try {
      setUploading(true);
      await contractApiRequest.uploadMilestoneFile(
        contractId,
        milestoneId,
        selectedFile,
      );
      toastSuccess({ message: t("uploaded", { name: selectedFile.name }) });
      onFilesChanged();
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : t("uploadFailed"),
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    if (fileToDelete.isSubmitted) {
      toastError({ message: t("cannotDeleteSubmitted") });
      setFileToDelete(null);
      return;
    }
    try {
      setDeletingId(fileToDelete.id);
      await contractApiRequest.deleteMilestoneFile(
        contractId,
        milestoneId,
        fileToDelete.id,
      );
      toastSuccess({
        message: t("deleted", { name: fileToDelete.fileName || t("thisFile") }),
      });
      setFileToDelete(null);
      onFilesChanged();
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : t("deleteFailed"),
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (!isPermissionLoading && !canViewFiles) {
    return (
      <div className="py-8 text-center space-y-2">
        <h3 className="text-sm font-semibold text-foreground">
          {t("noPermissionTitle")}
        </h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          {t("noPermissionDesc")}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div>
          <h3 className="text-xs font-medium text-foreground">
            {t("heading")}
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {t("subheading")}
          </p>
        </div>

        {canUploadFile && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => void handleUploadFile(e)}
              className="hidden"
              disabled={isContractExpired || uploading}
            />
            <Button
              size="sm"
              disabled={uploading || isContractExpired}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold h-8 px-4 shadow-2xs cursor-pointer disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  {t("uploading")}
                </>
              ) : (
                <>
                  <UploadCloud className="mr-1.5 size-3.5" />
                  {t("uploadFile")}
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      {isContractExpired && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-300">
          {t("contractExpiredUploadDisabled")}
        </div>
      )}

      {files.length > 0 ? (
        <div className="divide-y divide-border/40">
          {files.map((file) => (
            <div
              key={file.id}
              className="py-3 flex items-center justify-between gap-3 hover:bg-muted/20 px-2 rounded-lg transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-8 items-center justify-center rounded-lg bg-blue-500/10 text-[#0069D3] shrink-0">
                  <FileText className="size-4" />
                </div>
                <div className="min-w-0">
                  <span className="text-xs font-semibold text-foreground block truncate max-w-sm">
                    {file.fileName || t("fileFallback", { id: file.id })}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    {file.createdAt && (
                      <span>
                        {t("uploadedAt", { date: formatDate(file.createdAt) })}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                {file.isSubmitted && (
                  <span className="inline-flex items-center gap-1 rounded bg-zinc-200/70 px-2 py-0.5 text-[10px] font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    <Lock className="size-2.5" />
                    {t("submittedBadge")}
                  </span>
                )}

                {file.fileUrl && (
                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="h-8 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    <a
                      href={file.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      download
                    >
                      <Download className="size-3.5 mr-1" />
                      {t("download")}
                    </a>
                  </Button>
                )}

                {!file.isSubmitted && canDeleteFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={deletingId === file.id}
                    onClick={() => setFileToDelete(file)}
                    className="h-8 text-xs text-muted-foreground hover:text-rose-600 px-2 cursor-pointer"
                  >
                    {deletingId === file.id ? (
                      <Loader2 className="size-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="size-3.5" />
                    )}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-12 text-center space-y-2">
          <FileText className="size-6 mx-auto text-muted-foreground/60" />
          <h4 className="text-xs font-semibold text-foreground">
            {t("emptyTitle")}
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            {t("emptyDesc")}
          </p>
        </div>
      )}

      {/* Delete Milestone File Confirmation Dialog */}
      <AlertDialog
        open={Boolean(fileToDelete)}
        onOpenChange={(open) => {
          if (!open && !deletingId) {
            setFileToDelete(null);
          }
        }}
      >
        <AlertDialogContent className="max-w-sm rounded-[24px] border border-border bg-background p-5 shadow-2xl font-sans">
          <div className="flex flex-col gap-3">
            <AlertDialogTitle className="text-base font-bold text-foreground">
              {t("deleteTitle")}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {t("deleteHint", {
                name: fileToDelete?.fileName || t("thisFile"),
              })}
            </AlertDialogDescription>
            <div className="mt-2 flex flex-col gap-2">
              <Button
                variant="destructive"
                disabled={deletingId !== null}
                onClick={() => void handleConfirmDelete()}
                className="w-full rounded-full bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold cursor-pointer"
              >
                {deletingId !== null ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="mr-1.5 size-3.5" />
                )}
                {t("confirmDelete")}
              </Button>
              <AlertDialogCancel
                disabled={deletingId !== null}
                className="w-full rounded-full text-xs cursor-pointer"
              >
                {tCommon("cancel")}
              </AlertDialogCancel>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
