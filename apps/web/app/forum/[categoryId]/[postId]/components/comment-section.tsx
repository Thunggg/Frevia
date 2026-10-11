"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import {
  Heart,
  Loader2,
  MessageSquare,
  Pencil,
  Send,
  Trash2,
} from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@repo/ui/components/shadcn/alert-dialog";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@repo/ui/components/shadcn/avatar";
import { Button } from "@repo/ui/components/shadcn/button";
import type { ForumCommentType } from "@shared/types";

import {
  useCreateComment,
  useDeleteComment,
  useForumComments,
  useToggleCommentLike,
  useUpdateComment,
} from "@/hooks/use-forum";

import { ReportDialog } from "./report-dialog";

type CommentSectionProps = {
  postId: number;
  currentUserId: number | null;
};

const brandButtonClass =
  "gap-1.5 bg-[#4fae2e] text-white hover:bg-[#459928] dark:bg-[#4fae2e] dark:text-white dark:hover:bg-[#5bc03a]";

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function CommentSection({ postId, currentUserId }: CommentSectionProps) {
  const { data: commentsData, isLoading } = useForumComments(postId, 1, 50);
  const createComment = useCreateComment();
  const [newComment, setNewComment] = useState("");
  const isSubmitting = createComment.isPending;

  const handleSubmitComment = useCallback(() => {
    if (!newComment.trim() || isSubmitting) return;

    createComment.mutate(
      { postId, content: newComment.trim() },
      {
        onSuccess: () => {
          setNewComment("");
        },
      },
    );
  }, [postId, newComment, isSubmitting, createComment]);

  const comments: ForumCommentType[] = commentsData?.comments ?? [];
  const pagination = commentsData?.pagination;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <MessageSquare className="size-5 text-[#4fae2e]" />
        <h2 className="text-lg font-semibold tracking-tight text-foreground">
          Comments
        </h2>
        {pagination ? (
          <span className="rounded-full bg-[#eaf8df] px-2 py-0.5 text-xs font-medium text-[#4fae2e] dark:bg-[#4fae2e]/15">
            {pagination.total}
          </span>
        ) : null}
      </div>

      {currentUserId ? (
        <div className="rounded-xl border border-border p-4 sm:p-5">
          <div className="flex gap-3">
            <Avatar size="sm" className="mt-0.5">
              <AvatarFallback>Y</AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-3">
              <textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#4fae2e]/30 disabled:opacity-50"
                disabled={isSubmitting}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
              />
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  Press{" "}
                  <kbd className="rounded border border-border bg-muted px-1 py-0.5 text-[10px] font-medium">
                    Ctrl+Enter
                  </kbd>{" "}
                  to submit
                </p>
                <Button
                  size="sm"
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmitting}
                  className={brandButtonClass}
                >
                  {isSubmitting ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Send className="size-3.5" />
                  )}
                  Comment
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border px-4 py-6 text-center sm:px-6">
          <p className="text-sm text-muted-foreground">
            <Link
              href="/login"
              className="font-medium text-[#4fae2e] transition-colors hover:text-[#3f9225]"
            >
              Log in
            </Link>{" "}
            to join the discussion.
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="divide-y divide-border border-y border-border">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3 px-1 py-5">
              <div className="size-8 shrink-0 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/3 animate-pulse rounded bg-muted" />
                <div className="h-3 w-full animate-pulse rounded bg-muted" />
                <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {!isLoading && comments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border px-6 py-14 text-center">
          <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-[#eaf8df] text-[#4fae2e] dark:bg-[#4fae2e]/15">
            <MessageSquare className="size-7" />
          </div>
          <p className="text-lg font-medium text-foreground">No comments yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Be the first to share a tip, question, or experience.
          </p>
        </div>
      ) : null}

      {!isLoading && comments.length > 0 ? (
        <ul className="divide-y divide-border border-y border-border">
          {comments.map((comment) => (
            <li key={comment.id}>
              <CommentItem
                comment={comment}
                postId={postId}
                currentUserId={currentUserId}
              />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function CommentItem({
  comment,
  postId,
  currentUserId,
}: {
  comment: ForumCommentType;
  postId: number;
  currentUserId: number | null;
}) {
  const toggleLike = useToggleCommentLike(postId);
  const updateComment = useUpdateComment();
  const deleteComment = useDeleteComment();

  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);

  const isAuthor = currentUserId === comment.user.id;
  const liked = comment.likedByMe;
  const likeCount = comment.likeCount;
  const wasEdited =
    new Date(comment.updatedAt).getTime() !==
    new Date(comment.createdAt).getTime();

  const handleToggleLike = useCallback(() => {
    if (!currentUserId) return;
    toggleLike.mutate(comment.id);
  }, [toggleLike, comment.id, currentUserId]);

  const handleSaveEdit = useCallback(() => {
    if (!editContent.trim() || updateComment.isPending) return;

    updateComment.mutate(
      { postId, commentId: comment.id, content: editContent.trim() },
      {
        onSuccess: () => {
          setIsEditing(false);
        },
      },
    );
  }, [postId, comment.id, editContent, updateComment]);

  const handleDelete = useCallback(() => {
    deleteComment.mutate({ postId, commentId: comment.id });
  }, [deleteComment, postId, comment.id]);

  return (
    <div className="px-1 py-5 sm:px-2">
      <div className="flex gap-3">
        <Avatar size="sm">
          <AvatarImage
            src={comment.user?.profile?.avatarUrl ?? undefined}
            alt={comment.user?.profile?.displayName ?? "User"}
          />
          <AvatarFallback>
            {comment.user?.profile?.displayName?.charAt(0)?.toUpperCase() ??
              "?"}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-medium text-foreground">
              {comment.user?.profile?.displayName ?? `User #${comment.user.id}`}
            </span>
            <span className="text-foreground/35">·</span>
            <span className="text-xs text-muted-foreground">
              {formatDate(comment.createdAt)}
            </span>
            {wasEdited ? (
              <>
                <span className="text-foreground/35">·</span>
                <span className="text-xs italic text-muted-foreground">
                  edited
                </span>
              </>
            ) : null}
          </div>

          {isEditing ? (
            <div className="mt-2 space-y-2">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                rows={3}
                className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#4fae2e]/30"
                disabled={updateComment.isPending}
                autoFocus
              />
              <div className="flex items-center gap-2">
                <Button
                  size="xs"
                  onClick={handleSaveEdit}
                  disabled={!editContent.trim() || updateComment.isPending}
                  className={brandButtonClass}
                >
                  {updateComment.isPending ? (
                    <Loader2 className="size-3 animate-spin" />
                  ) : (
                    "Save"
                  )}
                </Button>
                <Button
                  size="xs"
                  variant="ghost"
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                  disabled={updateComment.isPending}
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
              {comment.content}
            </p>
          )}

          <div className="mt-2.5 flex flex-wrap items-center gap-1">
            {currentUserId ? (
              <Button
                variant="ghost"
                size="xs"
                className={
                  liked
                    ? "gap-1 text-[#4fae2e] hover:bg-[#eaf8df] hover:text-[#3f9225] dark:hover:bg-white/5"
                    : "gap-1 text-muted-foreground hover:bg-[#eaf8df]/60 hover:text-[#4fae2e] dark:hover:bg-white/5/40"
                }
                onClick={handleToggleLike}
                disabled={toggleLike.isPending}
              >
                <Heart
                  className={`size-3.5 transition-transform ${
                    liked ? "scale-110 fill-current" : ""
                  }`}
                />
                {likeCount > 0 ? (
                  <span className="text-xs tabular-nums">{likeCount}</span>
                ) : null}
                <span className="text-xs">{liked ? "Liked" : "Like"}</span>
              </Button>
            ) : null}

            {isAuthor && !isEditing ? (
              <>
                <Button
                  variant="ghost"
                  size="xs"
                  className="gap-1 text-muted-foreground hover:text-foreground"
                  onClick={() => setIsEditing(true)}
                >
                  <Pencil className="size-3.5" />
                  Edit
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="xs"
                      className="gap-1 text-muted-foreground hover:text-red-500"
                    >
                      <Trash2 className="size-3.5" />
                      Delete
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Comment</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this comment? This
                        action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDelete}
                        className="bg-destructive text-white hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            ) : null}

            {!isAuthor && currentUserId && !isEditing ? (
              <ReportDialog postId={postId} commentId={comment.id} />
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
