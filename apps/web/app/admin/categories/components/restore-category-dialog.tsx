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
  AlertDialogTrigger,
} from "@repo/ui/components/shadcn/alert-dialog";
import { toastError, toastSuccess } from "@repo/ui/components/shadcn/toast";
import type { ForumAdminCategoryType } from "@shared/types";
import { Loader2, RotateCcw } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface RestoreCategoryDialogProps {
  category: Pick<ForumAdminCategoryType, "id" | "name">;
}

export function RestoreCategoryDialog({
  category,
}: RestoreCategoryDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleRestore = async () => {
    setLoading(true);
    try {
      await adminApiRequest.restoreCategory(category.id);
      toastSuccess({ message: "Category restored successfully." });
      setOpen(false);
      router.refresh();
    } catch (err) {
      if (err instanceof ApiFail) {
        const errorDetail = err.response?.error?.details?.[0]?.message;
        toastError({ message: errorDetail ?? "Failed to restore category." });
      } else {
        toastError({ message: "An unexpected error occurred." });
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
          className="h-8 w-8 text-muted-foreground hover:bg-[#4fae2e]/10 hover:text-[#4fae2e] transition-colors"
          title="Restore category"
          aria-label={`Restore category ${category.name}`}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            Restore Category
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to restore category{" "}
              <span className="font-semibold text-foreground">
                &quot;{category.name}&quot;
              </span>
              ? It will become active again in the forum.
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          <Button
            onClick={(e) => {
              e.preventDefault();
              void handleRestore();
            }}
            disabled={loading}
            className="bg-[#4fae2e] text-white hover:bg-[#3f9225]"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Restore Category
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}