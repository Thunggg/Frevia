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
} from "@/components/icons";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { Input } from "@repo/ui/components/shadcn/input";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import { contractApiRequest, extractContractData } from "@/apiRequests/contract";
import { ApiFail } from "@/lib/http";
import type { MilestoneFileType, MilestoneType } from "@shared/types";

interface SubmitMilestoneDialogProps {
  contractId: number;
  milestone: MilestoneType | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SubmitMilestoneDialog({
  contractId,
  milestone,
  open,
  onOpenChange,
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

    // Max 25MB check
    if (file.size > 25 * 1024 * 1024) {
      toastError({ message: "File size exceeds 25MB limit" });
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setIsUploadingFile(true);
    try {
      const response = await contractApiRequest.uploadMilestoneFile(
        contractId,
        milestone.id,
        file,
      );
      const uploaded = extractContractData(response);
      setUploadedFiles((prev) => [...prev, uploaded]);
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
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = async (fileItem: MilestoneFileType) => {
    try {
      await contractApiRequest.deleteMilestoneFile(
        contractId,
        milestone.id,
        fileItem.id,
      );
      setUploadedFiles((prev) => prev.filter((f) => f.id !== fileItem.id));
    } catch {
      // If backend delete fails, remove from local submission list anyway
      setUploadedFiles((prev) => prev.filter((f) => f.id !== fileItem.id));
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

      await queryClient.invalidateQueries({
        queryKey: ["client-contract-detail", contractId],
      });
      await queryClient.invalidateQueries({
        queryKey: ["client-contract-milestones", contractId],
      });

      toastSuccess({
        message: isResubmission
          ? "Deliverables resubmitted for client review!"
          : "Deliverables submitted for client review!",
      });

      // Reset form
      setMessage("");
      setLinks([]);
      setLinkInput("");
      setUploadedFiles([]);
      onOpenChange(false);
    } catch (error) {
      toastError({
        message:
          error instanceof ApiFail
            ? error.response.error.message
            : "Failed to submit deliverables. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">
            {isResubmission ? "Resubmit Deliverables" : "Submit Deliverables"}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Milestone: <strong className="text-foreground">{milestone.title}</strong> (
            ${Number(milestone.amount).toLocaleString()})
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* Notes / Message */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">
              Work Notes & Deliverable Summary
            </label>
            <Textarea
              placeholder="Describe what you completed, results achieved, or instructions for the client..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              className="resize-none text-xs rounded-xl"
            />
          </div>

          {/* Links (e.g. Figma, GitHub, Live Demo, Google Drive) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              Project & Preview Links (Optional)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                <Input
                  type="url"
                  placeholder="https://github.com/..., https://figma.com/..."
                  value={linkInput}
                  onChange={(e) => setLinkInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddLink();
                    }
                  }}
                  className="pl-8 text-xs rounded-xl"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddLink}
                className="rounded-xl text-xs shrink-0"
              >
                <Plus className="mr-1 size-3.5" />
                Add
              </Button>
            </div>

            {/* List of added links */}
            {links.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {links.map((link, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/40 px-3 py-1.5 text-xs text-foreground"
                  >
                    <span className="truncate max-w-[340px] text-primary hover:underline">
                      {link}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveLink(idx)}
                      className="text-muted-foreground hover:text-destructive cursor-pointer p-1"
                      title="Remove link"
                    >
                      <X className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* File Attachments */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-foreground">
              Attach Deliverable Files (Optional)
            </label>

            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              id="milestone-file-upload"
            />

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isUploadingFile}
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl text-xs flex items-center gap-1.5 border-dashed border-border"
              >
                {isUploadingFile ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Upload className="size-3.5" />
                )}
                <span>Upload Deliverable File</span>
              </Button>
              <span className="text-[11px] text-muted-foreground">
                ZIP, PDF, images, etc. (max 25MB)
              </span>
            </div>

            {/* List of uploaded files */}
            {uploadedFiles.length > 0 && (
              <div className="space-y-1.5 pt-1">
                {uploadedFiles.map((f) => (
                  <div
                    key={f.id}
                    className="flex items-center justify-between rounded-xl border border-border/80 bg-muted/40 px-3 py-1.5 text-xs text-foreground"
                  >
                    <div className="flex items-center gap-2 truncate max-w-[320px]">
                      <FileText className="size-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate font-medium">{f.fileName}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => void handleRemoveFile(f)}
                      className="text-muted-foreground hover:text-destructive cursor-pointer p-1"
                      title="Remove file"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="pt-3 gap-2 sm:gap-0 border-t border-border/60">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting || isUploadingFile}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting || isUploadingFile}
              className="rounded-xl bg-[#4fae2e] hover:bg-[#459928] text-white text-xs font-semibold"
            >
              {isSubmitting ? (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              ) : (
                <Send className="mr-1.5 size-3.5" />
              )}
              {isResubmission ? "Resubmit Work" : "Submit Work"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
