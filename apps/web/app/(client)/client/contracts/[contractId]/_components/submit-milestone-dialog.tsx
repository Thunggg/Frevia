"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Link2,
  Loader2,
  Plus,
  Send,
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
import { contractApiRequest } from "@/apiRequests/contract";
import { ApiFail } from "@/lib/http";
import type { MilestoneType } from "@shared/types";

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
  const [message, setMessage] = useState("");
  const [linkInput, setLinkInput] = useState("");
  const [links, setLinks] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!milestone) return null;

  const isResubmission = milestone.status === "CHANGES_REQUESTED";

  const handleAddLink = () => {
    const trimmed = linkInput.trim();
    if (!trimmed) return;

    // Validate URL
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && links.length === 0) {
      toastError({ message: "Please provide either notes or preview links for your deliverables." });
      return;
    }

    setIsSubmitting(true);
    try {
      await contractApiRequest.submitMilestone(contractId, milestone.id, {
        message: message.trim() || undefined,
        links,
        fileIds: [],
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
      <DialogContent className="sm:max-w-lg rounded-2xl">
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
            <label className="text-xs font-medium text-foreground">
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
            <label className="text-xs font-medium text-foreground">
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

          <DialogFooter className="pt-3 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="rounded-xl text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
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
