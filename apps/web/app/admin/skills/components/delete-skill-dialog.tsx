"use client";

import { adminApiRequest } from "@/apiRequests/admin";
import { ApiFail } from "@/lib/http";
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
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type { SkillAdminItemType } from "@shared/types";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeleteSkillDialogProps {
  skill: Pick<SkillAdminItemType, "id" | "name" | "jobCount"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteSkillDialog({
  skill,
  open,
  onOpenChange,
}: DeleteSkillDialogProps) {
  const t = useTranslations("adminSkills");
  const tCommon = useTranslations("adminCommon");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!skill) return null;

  const hasJobs = (skill.jobCount ?? 0) > 0;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await adminApiRequest.deleteSkill(skill.id);
      toastSuccess({ message: t("deletedToast") });
      onOpenChange(false);
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
            {hasJobs && <AlertTriangle className="h-5 w-5 text-amber-500" />}
            {t("deleteTitle", { name: skill.name })}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 pt-1 text-sm text-muted-foreground">
              {hasJobs && (
                <div className="rounded-md bg-amber-50 dark:bg-amber-950/40 p-3 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs">
                  <p className="font-semibold mb-1">
                    {t("deleteInUseHeading")}
                  </p>
                  {t("deleteInUseWarning", { count: skill.jobCount ?? 0 })}
                </div>
              )}
              <p>{t("deleteConfirm", { name: skill.name })}</p>
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