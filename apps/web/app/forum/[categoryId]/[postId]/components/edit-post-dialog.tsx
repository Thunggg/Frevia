"use client";

import { useState, useCallback } from "react";
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
import { Loader2, Pencil } from "lucide-react";
import { useUpdatePost } from "@/hooks/use-forum";
import { RichTextEditor } from "@/components/rich-text-editor";

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
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Post</DialogTitle>
          <DialogDescription>
            Update your post title and content.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-post-title">Title</Label>
            <Input
              id="edit-post-title"
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
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim() || isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Pencil className="h-4 w-4" />
            )}
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
