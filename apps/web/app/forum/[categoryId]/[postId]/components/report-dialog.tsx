"use client";

import { useState, useCallback } from "react";
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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { forumApiRequest } from "@/apiRequests/forum";
import { forumKeys } from "@/hooks/use-forum";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type { ApiResponse } from "@shared/types";

function extractData<T>(response: ApiResponse<T>): T {
  if (response.success && "data" in response) {
    return response.data;
  }
  throw new Error("Unexpected API error response");
}

type ReportDialogProps = {
  postId: number;
  commentId?: number;
  trigger?: React.ReactNode;
};

export function ReportDialog({
  postId,
  commentId,
  trigger,
}: ReportDialogProps) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");

  // Query: kiểm tra đã report chưa (chỉ fetch khi dialog mở)
  const { data: reportStatus } = useQuery({
    queryKey: commentId
      ? ["forum", "report", "comment", postId, commentId]
      : ["forum", "report", "post", postId],
    queryFn: () =>
      commentId
        ? forumApiRequest
            .checkCommentReported(postId, commentId)
            .then(extractData)
        : forumApiRequest.checkPostReported(postId).then(extractData),
    select: (data) => data.reported ?? false,
    enabled: open,
    staleTime: Infinity, // Nếu đã report thì không cần check lại
  });

  const reported = reportStatus ?? false;

  // Mutation: gửi report
  const reportMutation = useMutation({
    mutationFn: () => {
      if (commentId) {
        return forumApiRequest.reportComment(postId, commentId, reason.trim());
      }
      return forumApiRequest.reportPost(postId, reason.trim());
    },
    onSuccess: () => {
      setReason("");
      toastSuccess({ message: "Report submitted successfully" });

      // Cập nhật cache report status
      queryClient.setQueryData(
        commentId
          ? ["forum", "report", "comment", postId, commentId]
          : ["forum", "report", "post", postId],
        { reported: true },
      );

      setTimeout(() => setOpen(false), 1500);
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : "Failed to submit report";
      toastError({ message });
    },
  });

  const handleOpenChange = useCallback((isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setReason("");
    }
  }, []);

  // Nếu đã report và dialog đang đóng → hiển thị badge "Reported"
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
              disabled={reportMutation.isPending}
              className="resize-none"
            />
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={reportMutation.isPending}
          >
            {reported ? "Close" : "Cancel"}
          </Button>
          {!reported && (
            <Button
              variant="destructive"
              onClick={() => reportMutation.mutate()}
              disabled={!reason.trim() || reportMutation.isPending}
            >
              {reportMutation.isPending ? (
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
