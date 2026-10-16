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
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!banner) return null;

  const handleDelete = async () => {
    setLoading(true);
    try {
      await adminApiRequest.deleteBanner(banner.id);
      toastSuccess({ message: "Banner deleted successfully." });
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiFail) {
        const errorDetail = err.response?.error?.details?.[0]?.message;
        toastError({ message: errorDetail ?? "Failed to delete banner." });
      } else {
        toastError({ message: "An unexpected error occurred." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Banner: {banner.title}</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete banner &quot;{banner.title}&quot;?
            This action moves the banner to trash and can be undone via
            restore.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <Button
            onClick={(e) => {
              e.preventDefault();
              void handleDelete();
            }}
            disabled={loading}
            variant="destructive"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Delete Banner
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}