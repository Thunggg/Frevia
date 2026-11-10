"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  FileText,
  Link2,
  Loader2,
  Plus,
  Send,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { Button } from "@repo/ui/components/shadcn/button";
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
import { ApiFail } from "@/lib/http";
import type { MilestoneFileType, MilestoneType } from "@shared/types";

interface SubmitMilestoneDialogProps {
  contractId: number;
  milestone: MilestoneType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function SubmitMilestoneDialog({
  contractId,
  milestone,
  open,
  onOpenChange,
  onSuccess,
}: SubmitMilestoneDialogProps) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [message, setMessage] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [links, setLinks] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<MilestoneFileType[]>([]);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!milestone) return null;

  const isResubmission = milestone.status === "CHANGES_REQUESTED";

  const handleAddLink = () => {
    const trimmed = linkInput.trim();
    if (!trimmed) return;

    try {
      new URL(trimmed);
      if (!links.includes(trimmed)) {
        setLinks([...links, trimmed]);
        setLinkInput("");
      }
    } catch {
      toastError({ message: "Please enter a valid URL (including https://)" });
    }
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
      toastError({ message: "File exceeds 25MB limit" });
      return;
    }

    setIsUploadingFile(true);
    try {
      const res = await contractApiRequest.uploadMilestoneFile(
        contractId,
        milestone.id,
        file,
      );
      const data = extractContractData(res);
      setUploadedFiles((prev) => [...prev, data]);
      toastSuccess({ message: `Uploaded "${file.name}"` });
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Failed to upload file. Please try again.",
      });
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleRemoveFile = async (file: MilestoneFileType) => {
    try {
      await contractApiRequest.deleteMilestoneFile(
        contractId,
        milestone.id,
        file.id,
      );
      setUploadedFiles((prev) => prev.filter((f) => f.id !== file.id));
      toastSuccess({ message: "Removed file attachment" });
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Failed to remove file.",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!message.trim() && links.length === 0 && uploadedFiles.length === 0) {
      toastError({
        message:
          "Please provide deliverable notes, preview links, or attach files.",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await contractApiRequest.submitMilestone(contractId, milestone.id, {
        message: message.trim() || undefined,
        links,
        fileIds: uploadedFiles.map((f) => f.id),
      });

      toastSuccess({
        message: isResubmission
          ? "Deliverables resubmitted successfully!"
          : "Milestone submitted for client review!",
      });

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

      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Failed to submit milestone.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
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
                  {isResubmission ? "Resubmit Deliverables" : "Submit Milestone Deliverables"}
                </SheetTitle>
                <SheetDescription className="text-xs text-zinc-400 mt-0.5">
                  Milestone: <strong className="text-zinc-900 dark:text-zinc-100">{milestone.title}</strong> • $
                  {Number(milestone.amount).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                  })}
                </SheetDescription>
              </div>
            </div>
          </SheetHeader>

          <form id="submit-milestone-form" onSubmit={handleSubmit} className="space-y-4 pt-4">
            {/* Notes / Message */}
            <div>
              <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block mb-1.5">
                Deliverable Summary & Notes
              </label>
              <textarea
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe what has been delivered, how to access or verify the work, testing instructions..."
                className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 text-xs text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:border-[#0069D3] focus:outline-hidden resize-none leading-relaxed"
              />
            </div>

            {/* External Links */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                Project / Preview Links (GitHub, Figma, Live URL)
              </label>
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Link2 className="absolute left-2.5 top-2.5 size-3.5 text-zinc-400" />
                  <input
                    type="url"
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    placeholder="https://..."
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
                  Add Link
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
                        title="Remove link"
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
              <label className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 block">
                Attach Deliverable Files (ZIP, Code, PDF, etc. max 25MB)
              </label>

              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileSelect}
                className="hidden"
              />

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploadingFile}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-lg text-xs flex items-center gap-1.5 border-dashed border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 cursor-pointer h-8"
              >
                {isUploadingFile ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Upload className="size-3.5" />
                )}
                <span>Upload Deliverable File</span>
              </Button>

              {uploadedFiles.length > 0 && (
                <div className="space-y-1.5 pt-1">
                  {uploadedFiles.map((f) => (
                    <div
                      key={f.id}
                      className="flex items-center justify-between rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-800 dark:text-zinc-200"
                    >
                      <div className="flex items-center gap-2 truncate max-w-[260px]">
                        <FileText className="size-3.5 text-zinc-400 shrink-0" />
                        <span className="truncate font-medium">{f.fileName}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleRemoveFile(f)}
                        className="text-zinc-400 hover:text-rose-500 cursor-pointer p-0.5"
                        title="Remove file"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
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
            Cancel
          </Button>
          <Button
            type="submit"
            form="submit-milestone-form"
            size="sm"
            disabled={isSubmitting || isUploadingFile}
            className="rounded-lg bg-[#0069D3] hover:bg-[#0055b3] text-white text-xs font-semibold h-8 px-4 cursor-pointer"
          >
            {isSubmitting ? (
              <Loader2 className="mr-1.5 size-3.5 animate-spin" />
            ) : (
              <Send className="mr-1.5 size-3.5" />
            )}
            {isResubmission ? "Resubmit Work" : "Submit Work"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
