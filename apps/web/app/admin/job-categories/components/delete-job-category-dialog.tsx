"use client";

import { adminApiRequest } from "@/apiRequests/admin";
import { useBackendMessage } from "@/hooks/use-backend-message";
import { ApiFail } from "@/lib/http";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/shadcn/alert-dialog";
import { Button } from "@repo/ui/components/shadcn/button";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type { JobCategoryAdminItemType } from "@shared/types";
import { AlertTriangle, Info, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeleteJobCategoryDialogProps {
  jobCategory: Pick<JobCategoryAdminItemType, "id" | "name" | "jobCount"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteJobCategoryDialog({
  jobCategory,
  open,
  onOpenChange,
}: DeleteJobCategoryDialogProps) {
  const t = useTranslations("adminJobCategories");
  const tCommon = useTranslations("adminCommon");
  const toBackendMessage = useBackendMessage();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  // Thông báo 409 (danh mục vẫn còn công việc đang hoạt động) hiển thị ngay
  // trong dialog để Admin đọc được gợi ý chuyển sang trạng thái "Tạm ngưng".
  const [conflictMessage, setConflictMessage] = useState<string | null>(null);

  if (!jobCategory) return null;

  const hasJobs = (jobCategory.jobCount ?? 0) > 0;

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setConflictMessage(null);
    }
    onOpenChange(nextOpen);
  };

  const handleDelete = async () => {
    setLoading(true);
    setConflictMessage(null);
    try {
      await adminApiRequest.deleteJobCategory(jobCategory.id);
      toastSuccess({ message: t("deletedToast") });
      handleOpenChange(false);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiFail) {
        // BFF đã dịch message của backend; `toBackendMessage` dịch dự phòng
        // trường hợp message còn là key thô (ví dụ "Error.JobCategoryHasJobs").
        const errorDetail = err.response?.error?.details?.[0]?.message;
        const message = toBackendMessage(
          errorDetail ?? err.message ?? t("deleteFailed"),
        );
        if (err.status === 409) {
          setConflictMessage(message);
        }
        toastError({ message });
      } else {
        toastError({ message: tCommon("unexpectedError") });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {hasJobs && <AlertTriangle className="h-5 w-5 text-amber-500" />}
            {t("deleteTitle", { name: jobCategory.name })}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 pt-1 text-sm text-muted-foreground">
              {hasJobs && (
                <div className="rounded-md bg-amber-50 dark:bg-amber-950/40 p-3 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs">
                  <p className="font-semibold mb-1">
                    {t("deleteInUseHeading")}
                  </p>
                  {t("deleteInUseWarning", { count: jobCategory.jobCount ?? 0 })}
                </div>
              )}
              {conflictMessage && (
                <div className="rounded-md bg-destructive/10 p-3 border border-destructive/30 text-destructive text-xs">
                  <p className="flex items-start gap-1.5 font-semibold">
                    <Info className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{t("deleteConflictHeading")}</span>
                  </p>
                  <p className="mt-1">{conflictMessage}</p>
                  <p className="mt-1">{t("deleteConflictHint")}</p>
                </div>
              )}
              <p>{t("deleteConfirm", { name: jobCategory.name })}</p>
              <p className="text-xs">{t("deleteSoftDeleteNote")}</p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {tCommon("cancel")}
          </AlertDialogCancel>
          <Button
            onClick={(e) => {
              e.preventDefault();
              void handleDelete();
            }}
            disabled={loading}
            variant="destructive"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("deleteAction")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
