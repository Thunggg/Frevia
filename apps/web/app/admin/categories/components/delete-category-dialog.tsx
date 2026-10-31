"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminApiRequest } from "@/apiRequests/admin";
import { Button } from "@repo/ui/components/shadcn/button";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@repo/ui/components/shadcn/alert-dialog";
import { ApiFail } from "@/lib/http";
import { toastSuccess, toastError } from "@repo/ui/components/shadcn/toast";
import { Info, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { ForumCategoryType } from "@shared/types";

interface DeleteCategoryDialogProps {
  category: Pick<ForumCategoryType, "id" | "name" | "postCount"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function DeleteCategoryDialog({
  category,
  open,
  onOpenChange,
  onSuccess,
}: DeleteCategoryDialogProps) {
  const t = useTranslations("adminCategories");
  const tCommon = useTranslations("adminCommon");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!category) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await adminApiRequest.deleteCategory(category.id);
      toastSuccess({ message: t("deletedToast") });
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
      router.refresh();
    } catch (err) {
      if (err instanceof ApiFail) {
        const errorDetail = err.response?.error?.details?.[0]?.message;
        toastError({ message: errorDetail ?? t("deleteFailed") });
      } else {
        toastError({ message: tCommon("unexpectedError") });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            {t("deleteTitle", { name: category.name })}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 pt-1 text-sm text-muted-foreground">
              <p>{t("deleteConfirm", { name: category.name })}</p>
              {category.postCount > 0 && (
                <div className="rounded-md bg-amber-50 dark:bg-amber-950/40 p-3 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs">
                  <p className="flex items-start gap-1.5">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      {t("deletePostWarning", { count: category.postCount })}
                    </span>
                  </p>
                </div>
              )}
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