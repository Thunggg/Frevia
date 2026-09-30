"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/shadcn/dialog";
import { Button } from "@repo/ui/components/shadcn/button";
import { Textarea } from "@repo/ui/components/shadcn/textarea";
import { Label } from "@repo/ui/components/shadcn/label";
import { Loader2, Flag, CheckCircle2 } from "lucide-react";
import { forumApiRequest } from "@/apiRequests/forum";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";

type ReportDialogProps = {
  postId: number;
  commentId?: number;
  hasReported?: boolean;
  trigger?: React.ReactNode;
  onReported?: () => void;
};

export function ReportDialog({
  postId,
  commentId,
  hasReported = false,
  trigger,
  onReported,
}: ReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reported, setReported] = useState(hasReported);

  useEffect(() => {
    if (hasReported) {
      setReported(true);
      return;
    }

    let cancelled = false;
    const check = commentId
      ? forumApiRequest.checkCommentReported(postId, commentId)
      : forumApiRequest.checkPostReported(postId);

    check
      .then((result) => {
        if (!cancelled && result.success && result.data.reported) {
          setReported(true);
          onReported?.();
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!reason.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      let result;
      if (commentId) {
        result = await forumApiRequest.reportComment(
          postId,
          commentId,
          reason.trim(),
        );
      } else {
        result = await forumApiRequest.reportPost(postId, reason.trim());
      }
      if (result.success) {
        setReported(true);
        setReason("");
        toastSuccess({ message: "Report submitted successfully" });
        onReported?.();
        setTimeout(() => setOpen(false), 1500);
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to submit report";
      toastError({ message });
    } finally {
      setIsSubmitting(false);
    }
  }, [postId, commentId, reason, isSubmitting, onReported]);

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setReason("");
    }
  }, []);

  if (reported && !open) {
    return (
      <Button
        variant="ghost"
        size="xs"
        disabled
        className="gap-1 text-green-600"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        Reported
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="xs"
            className="gap-1 text-muted-foreground hover:text-orange-500"
          >
            <Flag className="h-3.5 w-3.5" />
            Report
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report Content</DialogTitle>
          <DialogDescription>
            {reported
              ? "You have already reported this content."
              : "Please provide a reason for reporting this content."}
          </DialogDescription>
        </DialogHeader>

        {reported ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
            <p className="text-sm text-muted-foreground">
              You have already reported this content. Our team will review it.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="report-reason">Reason</Label>
            <Textarea
              id="report-reason"
              placeholder="Why are you reporting this content?"
              rows={4}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              disabled={isSubmitting}
              className="resize-none"
            />
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            {reported ? "Close" : "Cancel"}
          </Button>
          {!reported && (
            <Button
              variant="destructive"
              onClick={handleSubmit}
              disabled={!reason.trim() || isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Flag className="h-4 w-4" />
              )}
              Report
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
