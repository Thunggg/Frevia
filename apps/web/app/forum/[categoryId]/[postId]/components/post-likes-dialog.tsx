"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@repo/ui/components/shadcn/dialog";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@repo/ui/components/shadcn/avatar";
import { Loader2, Heart } from "lucide-react";
import { useForumPostLikes } from "@/hooks/use-forum";

type PostLikesDialogProps = {
  postId: number;
  count: number;
};

export function PostLikesDialog({ postId, count }: PostLikesDialogProps) {
  const [open, setOpen] = useState(false);

  // Chỉ fetch danh sách người like khi dialog mở
  const { data: likes, isLoading } = useForumPostLikes(postId);

  const likers =
    likes?.map((like) => ({
      id: like.userId,
      displayName:
        like.user?.profile?.displayName ?? `User #${like.userId}`,
      avatarUrl: like.user?.profile?.avatarUrl ?? null,
    })) ?? [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          disabled={count === 0}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Heart className="h-3.5 w-3.5" />
          {count} {count === 1 ? "Like" : "Likes"}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Likes</DialogTitle>
          <DialogDescription>
            People who liked this post.
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-80 overflow-y-auto pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : likers.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No likes yet.
            </p>
          ) : (
            <ul className="space-y-1">
              {likers.map((liker) => (
                <li
                  key={liker.id}
                  className="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-muted"
                >
                  <Avatar>
                    <AvatarImage
                      src={liker.avatarUrl ?? undefined}
                      alt={liker.displayName}
                    />
                    <AvatarFallback>
                      {liker.displayName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium text-foreground">
                    {liker.displayName}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
