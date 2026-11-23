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
import { useActionPermission } from "@/hooks/use-action-permission";
import dynamic from "next/dynamic";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { buildSlugId } from "@/lib/slug-utils";
import type { ForumCategoryListResponseType } from "@shared/types";

const RichTextEditor = dynamic(
  () =>
    import("@/components/rich-text-editor").then((mod) => mod.RichTextEditor),
  {
    ssr: false,
    loading: () => <Skeleton className="h-48 w-full rounded-md" />,
  },
);

type CreateTalkDialogProps = {
  categories: ForumCategoryListResponseType;
  currentUserId: number | null;
};

export function CreateTalkDialog({
  categories,
  currentUserId,
}: CreateTalkDialogProps) {
  const router = useRouter();
  const t = useTranslations("forum");
  const createPost = useCreatePost();
  const { can } = useActionPermission();
  const canCreatePost = can("POST", "/api/forums/posts");

  const [open, setOpen] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(
    categories[0]?.id ?? 1,
  );
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const isSubmitting = createPost.isPending;

  const handleSubmit = useCallback(() => {
    if (!title.trim() || !content.trim() || isSubmitting) return;

    createPost.mutate(
      {
        categoryId: selectedCategoryId,
        title: title.trim(),
        content: content.trim(),
      },
      {
        onSuccess: (result) => {
          if (result?.moderationStatus === "REJECTED") {
            const msg =
              (result as { moderationMessage?: string | null })
                ?.moderationMessage || t("rejectedModeration");
            toast.error(msg);
            return;
          }
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
          if (result?.moderationStatus === "APPROVED") {
            const msg =
              (result as { moderationMessage?: string | null })
                ?.moderationMessage || t("approvedModeration");
            setOpen(false);
            setTitle("");
            setContent("");
            toast.success(msg);
            const foundCategory = categories.find(
              (c) => c.id === selectedCategoryId,
            );
            if (result?.id && result?.slug && foundCategory) {
              router.push(
                `/forum/${buildSlugId(foundCategory.slug, foundCategory.id)}/${buildSlugId(result.slug, result.id)}`,
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
    selectedCategoryId,
    title,
    content,
    isSubmitting,
    createPost,
    categories,
    router,
    t,
  ]);

  if (!currentUserId) {
    return (
      <Button
        asChild
        className="rounded-lg bg-[#0069D3] hover:bg-blue-600 text-white text-xs sm:text-sm font-semibold px-4 py-2 shadow-xs transition-colors"
      >
        <Link href="/login?redirect=/forum">
          <Plus className="mr-1.5 size-4" />
          Create new talk
        </Link>
      </Button>
    );
  }

  if (!canCreatePost) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-lg bg-[#0069D3] hover:bg-blue-600 text-white text-xs sm:text-sm font-semibold px-4 py-2 shadow-xs transition-colors">
          <Plus className="mr-1.5 size-4" />
          Create new talk
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tạo cuộc thảo luận mới</DialogTitle>
          <DialogDescription>
            Chia sẻ ý tưởng, đặt câu hỏi hoặc trao đổi cùng cộng đồng chuyên gia Frevia.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Category selection */}
          <div className="space-y-2">
            <Label htmlFor="category-select">Chuyên mục thảo luận</Label>
            <select
              id="category-select"
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(Number(e.target.value))}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-hidden focus:ring-2 focus:ring-[#0069D3]"
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="post-title">{t("postTitle")}</Label>
            <Input
              id="post-title"
              placeholder={t("postTitlePlaceholder")}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={200}
            />
          </div>

          {/* Content */}
          <div className="space-y-2">
            <Label>{t("postContent")}</Label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder={t("postContentPlaceholder")}
              minHeight="180px"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            {t("cancel")}
          </Button>
          <Button
            className="bg-[#0069D3] hover:bg-blue-600 text-white"
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 size-4 animate-spin" />
                {t("creating")}
              </>
            ) : (
              t("createPost")
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
