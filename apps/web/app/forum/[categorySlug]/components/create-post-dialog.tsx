"use client";

import { useState, useCallback } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
import { Loader2, Plus } from "@/components/icons";
import { toast } from "@repo/ui/components/shadcn/sonner";
import { useCreatePost } from "@/hooks/use-forum";
import dynamic from "next/dynamic";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { buildSlugId } from "@/lib/slug-utils";

const RichTextEditor = dynamic(
  () => import("@/components/rich-text-editor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => <Skeleton className="h-48 w-full rounded-md" />,
  },
);

type CreatePostDialogProps = {
  categoryId: number;
  categorySlug: string;
  categoryName: string;
  currentUserId: number | null;
};

const brandButtonClass =
  "h-11 gap-1.5 bg-[#0069D3] text-white hover:bg-blue-600 dark:bg-[#0069D3] dark:text-white dark:hover:bg-blue-500";

export function CreatePostDialog({
  categoryId,
  categorySlug,
  categoryName,
  currentUserId,
}: CreatePostDialogProps) {
  const router = useRouter();
  const t = useTranslations("forum");
  const createPost = useCreatePost();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const isSubmitting = createPost.isPending;

  const handleSubmit = useCallback(() => {
    if (!title.trim() || !content.trim() || isSubmitting) return;

    createPost.mutate(
      {
        categoryId,
        title: title.trim(),
        content: content.trim(),
      },
      {
        onSuccess: (result) => {
          // Bài bị AI từ chối -> giữ form, hiện lỗi
          if (result?.moderationStatus === "REJECTED") {
            const msg =
              (result as { moderationMessage?: string | null })
                ?.moderationMessage || t("rejectedModeration");
            toast.error(msg);
            return;
          }
          // Bài chờ duyệt -> đóng form, báo thông tin
          if (result?.moderationStatus === "PENDING") {
            const msg =
              (result as { moderationMessage?: string | null })
                ?.moderationMessage || t("pendingModeration");
            setOpen(false);
            setTitle("");
            setContent("");
            toast.info(msg);
            return;
          }
          // Bài được duyệt -> đóng form, điều hướng
          if (result?.moderationStatus === "APPROVED") {
            const msg =
              (result as { moderationMessage?: string | null })
                ?.moderationMessage || t("approvedModeration");
            setOpen(false);
            setTitle("");
            setContent("");
            toast.success(msg);
            if (result?.id && result?.slug) {
              router.push(
                `/forum/${buildSlugId(categorySlug, categoryId)}/${buildSlugId(result.slug, result.id)}`,
              );
            }
            return;
          }
        },
        onError: (error) => {
          toast.error(
            error instanceof Error ? error.message : t("genericError"),
          );
        },
      },
    );
  }, [
    categoryId,
    categorySlug,
    title,
    content,
    isSubmitting,
    createPost,
    router,
    t,
  ]);

  if (!currentUserId) {
    return (
      <Button asChild className={brandButtonClass}>
        <Link href="/login">
          <Plus className="h-4 w-4" />
          {t("newPost")}
        </Link>
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={brandButtonClass}>
          <Plus className="h-4 w-4" />
          {t("newPost")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("createTitle", { category: categoryName })}</DialogTitle>
          <DialogDescription>
            {t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="post-title">{t("fieldTitle")}</Label>
            <Input
              id="post-title"
              placeholder={t("titlePlaceholder")}
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
              placeholder={t("contentPlaceholder")}
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
              <Plus className="h-4 w-4" />
            )}
            {t("post")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
