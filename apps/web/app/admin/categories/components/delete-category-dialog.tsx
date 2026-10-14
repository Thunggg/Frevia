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
import { AlertTriangle, Loader2 } from "lucide-react";
import type { ForumCategoryType } from "@shared/types";

interface DeleteCategoryDialogProps {
  category: ForumCategoryType | null;
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
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (!category) return null;

  const hasPosts = category.postCount > 0;

  const handleDelete = async () => {
    if (hasPosts) {
      toastError({ message: "Error.ForumCategoryHasPosts" });
      return;
    }

    setLoading(true);
    try {
      await adminApiRequest.deleteCategory(category.id);
      toastSuccess({ message: "Category deleted successfully." });
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
      router.refresh();
    } catch (err) {
      if (err instanceof ApiFail) {
        const errorDetail = err.response?.error?.details?.[0]?.message;
        toastError({ message: errorDetail ?? "Failed to delete category." });
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
          <AlertDialogTitle className="flex items-center gap-2">
            {hasPosts && <AlertTriangle className="h-5 w-5 text-amber-500" />}
            Delete Category: {category.name}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 pt-1 text-sm text-muted-foreground">
              {hasPosts ? (
                <div className="rounded-md bg-amber-50 dark:bg-amber-950/40 p-3 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs">
                  <p className="font-semibold mb-1">Cannot Delete Category</p>
                  This category currently contains{" "}
                  <span className="font-bold">{category.postCount}</span>{" "}
                  post(s). Please move or delete all posts in this category before deleting it.
                </div>
              ) : (
                <p>
                  Are you sure you want to delete category{" "}
                  <span className="font-semibold text-foreground">
                    &quot;{category.name}&quot;
                  </span>
                  ? This action cannot be undone.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
          {hasPosts ? (
            <Button disabled variant="destructive">
              Cannot Delete
            </Button>
          ) : (
            <Button
              onClick={(e) => {
                e.preventDefault();
                void handleDelete();
              }}
              disabled={loading}
              variant="destructive"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Category
            </Button>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
