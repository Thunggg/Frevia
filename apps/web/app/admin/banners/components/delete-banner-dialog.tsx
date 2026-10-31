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
import type { BannerAdminItemType } from "@shared/types";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface DeleteBannerDialogProps {
  banner: Pick<BannerAdminItemType, "id" | "title"> | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteBannerDialog({
  banner,
  open,
  onOpenChange,
}: DeleteBannerDialogProps) {
  const t = useTranslations("adminBanners");
  const tCommon = useTranslations("adminCommon");
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!banner) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await adminApiRequest.deleteBanner(banner.id);
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
          <AlertDialogTitle>
            {t("deleteTitle", { title: banner.title })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t("deleteDescription", { title: banner.title })}
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