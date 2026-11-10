"use client";

import { useRef, useState } from "react";
import { useFormatter } from "next-intl";
import {
  Download,
  FileText,
  Loader2,
  Plus,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { contractApiRequest } from "@/apiRequests/contract";
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
  isFreelancer = false,
}: MilestoneFilesTabProps) {
  const format = useFormatter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

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
      toastSuccess({ message: "File removed." });
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

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleUploadFile}
      />

      {/* Top Header & Upload Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800/80 pb-3">
        <div>
          <h3 className="text-sm text-zinc-950 dark:text-zinc-50">
            Milestone Files & Resources
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Documents, assets, and project deliverables attached to this milestone.
          </p>
        </div>

        <Button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="rounded-sm bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold h-8 px-3 cursor-pointer self-start sm:self-auto"
        >
          {uploading ? (
            <>
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              <span>Uploading...</span>
            </>
          ) : (
            <>
              <UploadCloud className="mr-1.5 size-3.5" />
              <span>Upload New File</span>
            </>
          )}
        </Button>
      </div>

      {files.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {files.map((file) => (
            <div
              key={file.id}
              className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-950 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors shadow-2xs"
            >
              <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                  <FileText className="size-4" />
                </div>
                <div className="space-y-0.5 min-w-0 flex-1">
                  <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">
                    {file.fileName || `File #${file.id}`}
                  </p>
                  <p className="text-[11px] text-zinc-400">
                    Uploaded {formatDate(file.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  asChild
                  variant="ghost"
                  size="icon"
                  className="size-7 rounded-md text-[#0069D3] hover:bg-[#0069D3]/10"
                  title="Download"
                >
                  <a href={file.fileUrl} download target="_blank" rel="noopener noreferrer">
                    <Download className="size-3.5" />
                  </a>
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  disabled={deletingId === file.id}
                  onClick={() => handleDeleteFile(file)}
                  className="size-7 rounded-md text-zinc-400 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer"
                  title="Delete file"
                >
                  {deletingId === file.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-12 text-center space-y-3">
          <UploadCloud className="size-8 mx-auto text-zinc-400" />
          <h4 className="text-sm font-bold text-zinc-950 dark:text-zinc-50">
            No files attached yet
          </h4>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Upload specifications, design files, or assets to share them between client
            and freelancer for this milestone.
          </p>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="rounded-lg border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold cursor-pointer"
          >
            <Plus className="mr-1.5 size-3.5" />
            Upload File
          </Button>
        </div>
      )}
    </div>
  );
}

