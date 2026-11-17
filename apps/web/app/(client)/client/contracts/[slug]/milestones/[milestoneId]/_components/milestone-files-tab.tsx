"use client";

import { useRef, useState } from "react";
import { useFormatter } from "next-intl";
import {
  Download,
  FileText,
  Loader2,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";
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
}

export function MilestoneFilesTab({
  contractId,
  milestoneId,
  files,
  onFilesChanged,
}: MilestoneFilesTabProps) {
  const format = useFormatter();
  const { can } = useActionPermission();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 25 * 1024 * 1024) {
      toastError({ message: "File exceeds 25MB limit." });
      return;
    }

    try {
      setUploading(true);
      await contractApiRequest.uploadMilestoneFile(
        contractId,
        milestoneId,
        selectedFile,
      );
      toastSuccess({ message: `File "${selectedFile.name}" uploaded successfully!` });
      onFilesChanged();
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Failed to upload file. Please try again.",
      });
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDeleteFile = async (file: MilestoneFileType) => {
    if (!window.confirm(`Are you sure you want to delete file "${file.fileName || "this file"}"?`)) {
      return;
    }

    try {
      setDeletingId(file.id);
      await contractApiRequest.deleteMilestoneFile(
        contractId,
        milestoneId,
        file.id,
      );
      toastSuccess({ message: `File "${file.fileName}" deleted.` });
      onFilesChanged();
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Failed to delete file.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  if (!canViewFiles) {
    return (
      <div className="py-8 text-center space-y-2">
        <h3 className="text-sm font-semibold text-foreground">
          Không có quyền xem tệp đính kèm
        </h3>
        <p className="text-xs text-muted-foreground max-w-md mx-auto">
          Tài khoản của bạn chưa được cấp quyền xem danh sách tệp của milestone này.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-2">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/50 pb-3">
        <div>
          <h3 className="text-sm font-bold text-foreground">
            Milestone Shared Files
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Documents, assets, and project files attached to this milestone
          </p>
        </div>

        {canUploadFile && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => void handleUploadFile(e)}
              className="hidden"
            />
            <Button
              size="sm"
              disabled={uploading}
              onClick={() => fileInputRef.current?.click()}
              className="rounded-full bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold h-8 px-4 shadow-2xs cursor-pointer"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-1.5 size-3.5 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <UploadCloud className="mr-1.5 size-3.5" />
                  Upload File
                </>
              )}
            </Button>
          </div>
        )}
      </div>

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
                    {file.fileName || `File #${file.id}`}
                  </span>
                  <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                    {file.createdAt && (
                      <span>Uploaded {formatDate(file.createdAt)}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
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
                      Download
                    </a>
                  </Button>
                )}

                {canDeleteFile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={deletingId === file.id}
                    onClick={() => void handleDeleteFile(file)}
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
            No files attached yet
          </h4>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            Upload any briefs, assets, or specifications needed for this milestone.
          </p>
        </div>
      )}
    </div>
  );
}
