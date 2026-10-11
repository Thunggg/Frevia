"use client";

import { useState, useCallback } from "react";
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
import { Loader2, Plus } from "lucide-react";
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
          if (result?.id && result?.slug) {
            router.push(`/forum/${buildSlugId(categorySlug, categoryId)}/${buildSlugId(result.slug, result.id)}`);
          }
        },
      },
    );
  }, [categoryId, categorySlug, title, content, isSubmitting, createPost, router]);

  if (!currentUserId) {
    return (
      <Button asChild className={brandButtonClass}>
        <Link href="/login">
          <Plus className="h-4 w-4" />
          New Post
        </Link>
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className={brandButtonClass}>
          <Plus className="h-4 w-4" />
          New Post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Post in {categoryName}</DialogTitle>
          <DialogDescription>
            Share your thoughts with the community.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="post-title">Title</Label>
            <Input
              id="post-title"
              placeholder="What's on your mind?"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isSubmitting}
            />
          </div>
          <div className="space-y-2">
            <Label>Content</Label>
            <RichTextEditor
              value={content}
              onChange={setContent}
              placeholder="Write your post content here..."
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
            Cancel
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
            Post
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
