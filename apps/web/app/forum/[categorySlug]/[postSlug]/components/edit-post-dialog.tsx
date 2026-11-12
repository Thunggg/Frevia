"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
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
import { Input } from "@repo/ui/components/shadcn/input";
import { Label } from "@repo/ui/components/shadcn/label";
import { Loader2, Pencil } from "@/components/icons";
import dynamic from "next/dynamic";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { useUpdatePost } from "@/hooks/use-forum";

const RichTextEditor = dynamic(
  () => import("@/components/rich-text-editor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => <Skeleton className="h-48 w-full rounded-md" />,
  },
);

type EditPostDialogProps = {
  postId: number;
  initialTitle: string;
  initialContent: string;
  onUpdated?: (title: string, content: string) => void;
};

export function EditPostDialog({
  postId,
  initialTitle,
  initialContent,
  onUpdated,
}: EditPostDialogProps) {
  const t = useTranslations("forum");
  const updatePost = useUpdatePost();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);

  const isSubmitting = updatePost.isPending;

  // Khi mở dialog, reset về giá trị ban đầu
  const handleOpen = useCallback(
    (isOpen: boolean) => {
      setOpen(isOpen);
      if (isOpen) {
        setTitle(initialTitle);
        setContent(initialContent);
      }
    },
    [initialTitle, initialContent],
  );

  const handleSubmit = useCallback(() => {
    if (!title.trim() || !content.trim() || isSubmitting) return;

    updatePost.mutate(
      {
        postId,
        title: title.trim(),
        content: content.trim(),
      },
      {
        onSuccess: () => {
          setOpen(false);
          onUpdated?.(title.trim(), content.trim());
        },
      },
    );
  }, [postId, title, content, isSubmitting, updatePost, onUpdated]);

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="xs"
          className="gap-1 text-muted-foreground hover:text-foreground"
        >
          <Pencil className="h-3.5 w-3.5" />
          {t("edit")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("editTitle")}</DialogTitle>
          <DialogDescription>
            {t("editDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-post-title">{t("fieldTitle")}</Label>
            <Input
              id="edit-post-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("fieldContent")}</Label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              disabled={isSubmitting}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            {t("cancel")}
          </Button>
          <Button
            className="bg-[#0069D3] text-white hover:bg-blue-600 dark:bg-[#0069D3] dark:text-white dark:hover:bg-blue-500"
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
            {t("saveChanges")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
