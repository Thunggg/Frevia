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
import { buildSlugId } from "@/lib/slug-utils";
import { RichTextEditor } from "@/components/rich-text-editor";

type CreatePostDialogProps = {
  categoryId: number;
  categorySlug: string;
  categoryName: string;
  currentUserId: number | null;
};

const brandButtonClass =
  "h-11 gap-1.5 bg-[#4fae2e] text-white hover:bg-[#459928] dark:bg-[#4fae2e] dark:text-white dark:hover:bg-[#5bc03a]";

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
          setOpen(false);
          setTitle("");
          setContent("");
          // Bài bị AI đưa vào trạng thái PENDING -> chưa hiển thị công khai,
          // không điều hướng tới chi tiết (sẽ 404), chỉ báo cho người dùng.
          if (result?.moderationStatus === "PENDING") {
            toast.success(t("pendingModeration"));
            return;
          }
          if (result?.id && result?.slug) {
            router.push(
              `/forum/${buildSlugId(categorySlug, categoryId)}/${buildSlugId(result.slug, result.id)}`,
            );
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
            className="bg-[#4fae2e] text-white hover:bg-[#459928] dark:bg-[#4fae2e] dark:text-white dark:hover:bg-[#5bc03a]"
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
