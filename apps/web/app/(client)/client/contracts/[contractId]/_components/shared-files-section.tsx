"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Download,
  FileCode,
  FileImage,
  FileText,
  FolderArchive,
  Loader2,
  Paperclip,
  Trash2,
  Upload,
} from "@/components/icons";
import { Button } from "@repo/ui/components/shadcn/button";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogTitle,
} from "@repo/ui/components/shadcn/alert-dialog";
import { contractApiRequest, extractContractData } from "@/apiRequests/contract";
import { ApiFail } from "@/lib/http";
import type {
  GetSharedFilesResponseType,
  SharedFileType,
} from "@shared/types";

interface SharedFilesSectionProps {
  contractId: number;
  initialFiles?: GetSharedFilesResponseType | null;
  currentUserId: number;
  clientId: number;
  freelancerId: number;
  clientName: string;
  freelancerName: string;
  isFreelancer: boolean;
}

function formatDate(date: string | Date | null) {
  if (!date) return "N/A";
  const d = new Date(date);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const timeStr = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  if (isToday) return `Today, ${timeStr}`;
  const monthDay = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  if (d.getFullYear() === now.getFullYear()) {
    return `${monthDay}, ${timeStr}`;
  }
  return `${monthDay} ${d.getFullYear()}, ${timeStr}`;
}

function getFileIcon(fileName?: string | null) {
  if (!fileName) return <FileText className="size-4 text-muted-foreground" />;
  const ext = fileName.split(".").pop()?.toLowerCase();

  switch (ext) {
    case "png":
    case "jpg":
    case "jpeg":
    case "webp":
    case "gif":
    case "svg":
      return <FileImage className="size-4 text-blue-500" />;
    case "pdf":
      return <FileText className="size-4 text-rose-500" />;
    case "zip":
    case "rar":
    case "7z":
    case "tar":
    case "gz":
      return <FolderArchive className="size-4 text-amber-500" />;
    case "ts":
    case "tsx":
    case "js":
    case "jsx":
    case "json":
    case "html":
    case "css":
      return <FileCode className="size-4 text-emerald-500" />;
    case "xls":
    case "xlsx":
    case "csv":
      return <FileText className="size-4 text-emerald-600" />;
    default:
      return <FileText className="size-4 text-muted-foreground" />;
  }
}

export function SharedFilesSection({
  contractId,
  initialFiles,
  currentUserId,
  clientId,
  freelancerId,
  clientName,
  freelancerName,
  isFreelancer,
}: SharedFilesSectionProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [fileToDelete, setFileToDelete] = useState<SharedFileType | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Queries
  const { data: files = [] } = useQuery<GetSharedFilesResponseType>({
    queryKey: ["contract-shared-files", contractId],
    queryFn: () =>
      contractApiRequest.getSharedFiles(contractId).then(extractContractData),
    initialData: initialFiles ?? undefined,
  });

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (!selectedFiles || selectedFiles.length === 0) return;

    const file = selectedFiles[0];
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      toastError({ message: "File size exceeds 25MB limit" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploading(true);
    try {
      await contractApiRequest.uploadSharedFile(contractId, file);
      await queryClient.invalidateQueries({
        queryKey: ["contract-shared-files", contractId],
      });
      toastSuccess({ message: `Uploaded "${file.name}" to shared files` });
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Failed to upload file. Please try again.",
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDeleteFile = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await contractApiRequest.deleteSharedFile(contractId, fileToDelete.id);
      await queryClient.invalidateQueries({
        queryKey: ["contract-shared-files", contractId],
      });
      toastSuccess({ message: "Shared file removed successfully" });
      setFileToDelete(null);
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Failed to delete file. Files can only be deleted within 1 hour of upload.",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const checkDeleteEligibility = (file: SharedFileType) => {
    const isUploader = file.uploaderId === currentUserId;
    if (!isUploader) return { canDelete: false, isUploader: false, remainingMins: 0 };

    const ONE_HOUR_MS = 60 * 60 * 1000;
    const fileTime = new Date(file.createdAt).getTime();
    const elapsed = Date.now() - fileTime;
    const isExpired = elapsed > ONE_HOUR_MS;
    const remainingMins = Math.max(0, Math.ceil((ONE_HOUR_MS - elapsed) / (60 * 1000)));

    return {
      canDelete: !isExpired,
      isUploader: true,
      remainingMins,
    };
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-foreground">
              Shared Files
            </h3>
            {files.length > 0 && (
              <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                {files.length}
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground">
            Shared with {isFreelancer ? "the client" : "the freelancer"}
          </p>
        </div>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            className="hidden"
            id="contract-shared-file-input"
          />

          <Button
            size="sm"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="rounded-xl bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-semibold h-8 px-3 shadow-xs flex items-center gap-1.5 cursor-pointer shrink-0"
          >
            {isUploading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Upload className="size-3.5" />
            )}
            <span>Upload</span>
          </Button>
        </div>
      </div>

      {/* Files List */}
      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/80 bg-muted/10 py-6 px-4 text-center">
          <div className="mb-2 flex size-8 items-center justify-center rounded-lg bg-[#D0E1F8]/50 text-[#0069D3]">
            <Paperclip className="size-4" />
          </div>
          <p className="text-xs font-semibold text-foreground">
            No shared files yet
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Upload documents, assets or deliverables
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {files.map((file) => {
            const { canDelete, isUploader, remainingMins } =
              checkDeleteEligibility(file);

            let uploaderLabel = "Participant";
            if (isUploader) {
              uploaderLabel = "You";
            } else if (file.uploaderId === clientId) {
              uploaderLabel = `Client (${clientName})`;
            } else if (file.uploaderId === freelancerId) {
              uploaderLabel = `Freelancer (${freelancerName})`;
            }

            return (
              <div
                key={file.id}
                className="group flex items-center justify-between rounded-xl border border-border/70 bg-card p-3 hover:border-[#0069D3]/40 hover:bg-muted/10 transition-all gap-2.5"
              >
                {/* Left: Icon & Name & Meta */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#D0E1F8]/40 text-[#0069D3]">
                    {getFileIcon(file.fileName)}
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p
                      className="text-xs font-semibold text-foreground truncate"
                      title={file.fileName || `File #${file.id}`}
                    >
                      {file.fileName || `File #${file.id}`}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
                      <span className="font-medium text-foreground/80 shrink-0">
                        {uploaderLabel}
                      </span>
                      <span className="text-muted-foreground/40 shrink-0">•</span>
                      <span className="truncate">
                        {formatDate(file.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Download & Delete Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="flex size-7 items-center justify-center rounded-lg border border-border hover:bg-[#D0E1F8]/50 hover:text-[#0069D3] text-muted-foreground transition-colors cursor-pointer"
                    title="Download file"
                  >
                    <Download className="size-3.5" />
                  </a>

                  {isUploader && (
                    <button
                      type="button"
                      disabled={!canDelete}
                      onClick={() => setFileToDelete(file)}
                      title={
                        canDelete
                          ? `Delete file (${remainingMins}m remaining)`
                          : "Files can only be removed within 1 hour of upload"
                      }
                      className={`flex size-7 items-center justify-center rounded-lg border transition-colors ${
                        canDelete
                          ? "border-border text-muted-foreground hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 cursor-pointer"
                          : "border-transparent text-muted-foreground/30 cursor-not-allowed"
                      }`}
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!fileToDelete}
        onOpenChange={(open) => !open && setFileToDelete(null)}
      >
        <AlertDialogContent className="max-w-sm rounded-[24px] border border-border bg-background p-5 shadow-2xl font-sans">
          <div className="flex flex-col gap-3">
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Delete Shared File
            </AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground leading-relaxed">
              Are you sure you want to delete &ldquo;{fileToDelete?.fileName}&rdquo;?
              This action cannot be undone. Files can only be removed within 1 hour
              of being uploaded.
            </AlertDialogDescription>
            <div className="mt-2 flex flex-col gap-2">
              <Button
                disabled={isDeleting}
                onClick={() => void handleDeleteFile()}
                className="w-full rounded-full bg-red-600 hover:bg-red-700 text-white text-xs font-semibold"
              >
                {isDeleting ? (
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                ) : (
                  <Trash2 className="mr-1.5 size-3.5" />
                )}
                Confirm Delete
              </Button>
              <AlertDialogCancel asChild>
                <Button
                  variant="outline"
                  disabled={isDeleting}
                  className="w-full rounded-full text-xs"
                >
                  Cancel
                </Button>
              </AlertDialogCancel>
            </div>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
