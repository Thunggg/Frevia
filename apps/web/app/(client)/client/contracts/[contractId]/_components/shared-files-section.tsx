"use client";

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Clock,
  Download,
  FileCode,
  FileImage,
  FileText,
  FolderArchive,
  FolderOpen,
  Loader2,
  Paperclip,
  Plus,
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
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
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
    <div className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-border/60">
        <div className="flex items-center gap-2.5">
          <div className="flex size-7 items-center justify-center rounded-lg bg-[#F1F0F5] text-[#0069D3]">
            <FolderOpen className="size-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">
              Shared Project Files
            </h3>
            <span className="text-[11px] text-muted-foreground block">
              Files, assets, and documentation shared between you and the {isFreelancer ? "client" : "freelancer"}.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground font-medium hidden sm:inline">
            {files.length} file{files.length !== 1 ? "s" : ""}
          </span>

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
            className="rounded-full bg-[#0069D3] hover:bg-[#005bb8] text-white text-xs font-semibold h-8 px-3.5 shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            {isUploading ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Upload className="size-3.5" />
            )}
            <span>Upload File</span>
          </Button>
        </div>
      </div>

      {/* Files List */}
      {files.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card p-10 text-center">
          <div className="mb-2 flex size-10 items-center justify-center rounded-xl bg-[#F1F0F5] text-[#0069D3]">
            <Paperclip className="size-5" />
          </div>
          <p className="text-xs font-semibold text-foreground">
            No shared files uploaded yet
          </p>
          <p className="mt-1 text-[11px] text-muted-foreground max-w-sm">
            Share design assets, project specifications, briefs, and code archives directly in this contract space.
          </p>
          <Button
            size="sm"
            variant="outline"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
            className="mt-3 rounded-full text-xs font-medium"
          >
            <Plus className="mr-1 size-3" />
            Upload First File
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
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
                className="flex items-center justify-between rounded-xl border border-border/70 bg-card p-3.5 hover:border-[#0069D3]/40 transition-colors gap-3"
              >
                {/* Left: Icon & Name & Meta */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-[#F1F0F5]">
                    {getFileIcon(file.fileName)}
                  </div>

                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="text-xs font-semibold text-foreground truncate">
                      {file.fileName || `File #${file.id}`}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="font-medium text-foreground/80">
                        {uploaderLabel}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="size-3 text-muted-foreground/70" />
                        {formatDate(file.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right: Download & Delete Actions */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <a
                    href={file.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="flex size-8 items-center justify-center rounded-lg border border-border hover:bg-[#D0E1F8]/50 text-foreground hover:text-[#0069D3] transition-colors cursor-pointer"
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
                      className={`flex size-8 items-center justify-center rounded-lg border transition-colors ${
                        canDelete
                          ? "border-border text-muted-foreground hover:text-red-600 hover:border-red-200 cursor-pointer"
                          : "border-transparent text-muted-foreground/40 cursor-not-allowed"
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
