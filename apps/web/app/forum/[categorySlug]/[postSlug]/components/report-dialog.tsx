"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import { useBackendMessage } from "@/hooks/use-backend-message";
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
import { Loader2, Flag, CheckCircle2 } from "@/components/icons";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { forumApiRequest } from "@/apiRequests/forum";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type { ApiResponse } from "@shared/types";

function extractData<T>(response: ApiResponse<T>): T {
  if (response.success && "data" in response) {
    return response.data;
  }
  throw new Error("Error.Internal");
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
  const t = useTranslations("forum");
  const translateMessage = useBackendMessage();
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
    enabled: true,
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
      toastSuccess({ message: t("reportSubmitted") });

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
        error instanceof Error ? error.message : "Error.Internal";
      toastError({ message: translateMessage(message) });
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
      <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 ring-1 ring-inset ring-amber-600/20 dark:bg-amber-950/40 dark:text-amber-300 dark:ring-amber-400/25">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {t("reported")}
      </span>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button
            variant="ghost"
            size="xs"
            className="gap-1 text-muted-foreground hover:!text-amber-600"
          >
            <Flag className="h-3.5 w-3.5" />
            {t("report")}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("reportTitle")}</DialogTitle>
          <DialogDescription>
            {reported ? t("alreadyReported") : t("reportPrompt")}
          </DialogDescription>
        </DialogHeader>

        {reported ? (
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="h-12 w-12 text-amber-500" />
            <p className="text-sm text-muted-foreground">
              {t("alreadyReportedDetail")}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Label htmlFor="report-reason">{t("reportReason")}</Label>
            <Textarea
              id="report-reason"
              placeholder={t("reportReasonPlaceholder")}
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
            {reported ? t("close") : t("cancel")}
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
              {t("report")}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
