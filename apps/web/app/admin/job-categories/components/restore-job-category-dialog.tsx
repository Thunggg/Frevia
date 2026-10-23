"use client";

import { adminApiRequest } from "@/apiRequests/admin";
import { ApiFail } from "@/lib/http";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/components/shadcn/alert-dialog";
import { Button } from "@repo/ui/components/shadcn/button";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type { JobCategoryAdminItemType } from "@shared/types";
import { Loader2, RotateCcw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface RestoreJobCategoryDialogProps {
  jobCategory: Pick<JobCategoryAdminItemType, "id" | "name">;
  triggerClassName?: string;
}

export function RestoreJobCategoryDialog({
  jobCategory,
  triggerClassName,
}: RestoreJobCategoryDialogProps) {
  const t = useTranslations("adminJobCategories");
  const tCommon = useTranslations("adminCommon");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRestore = async () => {
    setLoading(true);
    try {
      await adminApiRequest.restoreJobCategory(jobCategory.id);
      toastSuccess({ message: t("restoredToast") });
      setOpen(false);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiFail) {
        const errorDetail = err.response?.error?.details?.[0]?.message;
        toastError({ message: errorDetail ?? t("restoreFailed") });
      } else {
        toastError({ message: tCommon("unexpectedError") });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={
            triggerClassName ??
            "h-8 w-8 text-muted-foreground hover:bg-[#4fae2e]/10 hover:text-[#4fae2e] transition-colors"
          }
          title={t("restoreTrigger")}
          aria-label={t("restoreTriggerOf", { name: jobCategory.name })}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {t("restoreTitle")}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <p className="text-sm text-muted-foreground">
              {t("restoreDescription", { name: jobCategory.name })}
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>
            {tCommon("cancel")}
          </AlertDialogCancel>
          <Button
            onClick={(e) => {
              e.preventDefault();
              void handleRestore();
            }}
            disabled={loading}
            className="bg-[#4fae2e] text-white hover:bg-[#3f9225]"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {t("restoreAction")}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
