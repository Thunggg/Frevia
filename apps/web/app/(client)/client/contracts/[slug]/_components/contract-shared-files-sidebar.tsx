"use client";

import { useRef, useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  File,
  Image as ImageIcon,
  Paperclip,
  Download,
  Trash2,
  UploadCloud,
  Loader2,
} from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { contractApiRequest } from "@/apiRequests/contract";
import { useActionPermission } from "@/hooks/use-action-permission";
import type { SharedFileType } from "@shared/types";

interface ContractSharedFilesSidebarProps {
  contractId: number;
  sharedFiles: SharedFileType[];
  isFreelancer: boolean;
}

export function ContractSharedFilesSidebar({
  contractId,
  sharedFiles = [],
  isFreelancer,
}: ContractSharedFilesSidebarProps) {
  const queryClient = useQueryClient();
  const format = useFormatter();
  const t = useTranslations("contractWorkspace.sharedFilesSidebar");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { can } = useActionPermission();
  const canViewSharedFiles = can("GET", "/api/contracts/:contractId/files");
  const canUploadSharedFile = can("POST", "/api/contracts/:contractId/files");
  const canDeleteSharedFile = can("DELETE", "/api/contracts/:contractId/files/:fileId");

  const [isUploading, setIsUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return "—";
    const d = new Date(date);
    return format.dateTime(d, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getFileIcon = (fileName?: string | null) => {
    if (!fileName) return <File className="size-4 text-zinc-500 shrink-0" />;
    const ext = fileName.split(".").pop()?.toLowerCase();
    if (ext === "pdf") {
      return <FileText className="size-4 text-rose-500 shrink-0" />;
    }
    if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext || "")) {
      return <ImageIcon className="size-4 text-blue-500 shrink-0" />;
    }
    return <File className="size-4 text-zinc-500 shrink-0" />;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canUploadSharedFile) return;

    if (file.size > 25 * 1024 * 1024) {
      toastError({ message: t("fileTooLarge") });
      return;
    }

    setIsUploading(true);
    try {
      await contractApiRequest.uploadSharedFile(contractId, file);
      await queryClient.invalidateQueries({
        queryKey: ["contract-shared-files", contractId],
      });
      toastSuccess({ message: t("uploaded", { name: file.name }) });
    } catch {
      toastError({ message: t("uploadFailed") });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteFile = async (fileId: number, fileName: string) => {
    if (!canDeleteSharedFile) return;
    setDeletingId(fileId);
    try {
      await contractApiRequest.deleteSharedFile(contractId, fileId);
      await queryClient.invalidateQueries({
        queryKey: ["contract-shared-files", contractId],
      });
      toastSuccess({ message: t("deleted", { name: fileName }) });
    } catch {
      toastError({ message: t("deleteFailed") });
    } finally {
      setDeletingId(null);
    }
  };

  if (!canViewSharedFiles) {
    return null;
  }

  return (
    <div className="border border-border bg-card p-5 shadow-xs space-y-4 font-sans">
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-border/70 pb-3">
        <div className="flex items-center gap-2">
          <Paperclip className="size-4 text-[#0069D3]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
            {t("title")}
          </h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
            {sharedFiles.length}
          </span>
        </div>

        {canUploadSharedFile && (
          <div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={handleFileChange}
            />
            <Button
              size="sm"
              variant="ghost"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
              className="h-7 px-2.5 rounded-lg text-xs font-medium text-[#0069D3] hover:bg-[#0069D3]/10 cursor-pointer"
            >
              {isUploading ? (
                <Loader2 className="mr-1.5 size-3 animate-spin" />
              ) : (
                <UploadCloud className="mr-1.5 size-3.5" />
              )}
              {t("upload")}
            </Button>
          </div>
        )}
      </div>

      {/* ── Files List ── */}
      {sharedFiles.length > 0 ? (
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {sharedFiles.map((file) => {
            const fileName = file.fileName || t("attachmentFallback");
            const fileUrl = file.fileUrl || "#";

            return (
              <div
                key={file.id}
                className="group flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/80 p-2.5 hover:border-border transition-colors text-xs"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {getFileIcon(fileName)}
                  <div className="min-w-0 flex-1">
                    <a
                      href={fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-medium text-foreground hover:text-[#0069D3] hover:underline truncate block"
                      title={fileName}
                    >
                      {fileName}
                    </a>
                    <span className="text-[10px] text-muted-foreground block mt-0.5">
                      {formatDate(file.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    title={t("downloadTooltip")}
                    className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Download className="size-3.5" />
                  </a>

                  {/* Delete button (client or uploader) */}
                  {!isFreelancer && canDeleteSharedFile && (
                    <button
                      onClick={() => handleDeleteFile(file.id, fileName)}
                      disabled={deletingId === file.id}
                      title={t("deleteTooltip")}
                      className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    >
                      {deletingId === file.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Trash2 className="size-3.5" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border/70 p-6 text-center">
          <Paperclip className="mx-auto size-6 text-muted-foreground/60 mb-2" />
          <p className="text-xs font-medium text-muted-foreground">
            {t("emptyTitle")}
          </p>
          <p className="text-[11px] text-muted-foreground/80 mt-1">
            {t("emptyHint")}
          </p>
        </div>
      )}
    </div>
  );
}
