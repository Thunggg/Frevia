"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@repo/ui/components/shadcn/card";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
import { Separator } from "@repo/ui/components/shadcn/separator";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
} from "@repo/ui/components/shadcn/avatar";
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
  Heart,
  Send,
  Loader2,
  MessageSquare,
  Inbox,
  Pencil,
  Trash2,
} from "lucide-react";
import type { ForumCommentType } from "@shared/types";
import {
  useForumComments,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
  useToggleCommentLike,
} from "@/hooks/use-forum";
import { ReportDialog } from "./report-dialog";

type CommentSectionProps = {
  postId: number;
  currentUserId: number | null;
};

export function CommentSection({ postId, currentUserId }: CommentSectionProps) {
  // lấy danh sách comments từ server
  const { data: commentsData, isLoading } = useForumComments(postId, 1, 50);
  const createComment = useCreateComment();
  const [newComment, setNewComment] = useState("");
  const isSubmitting = createComment.isPending;

  // Xử lý tạo comment mới
  const handleSubmitComment = useCallback(() => {
    if (!newComment.trim() || isSubmitting) return;

    createComment.mutate(
      { postId, content: newComment.trim() },
      {
        onSuccess: () => {
          // Xóa input sau khi tạo thành công
          setNewComment("");
        },
      },
    );
  }, [postId, newComment, isSubmitting, createComment]);

  const comments: ForumCommentType[] = commentsData?.comments ?? [];
  const pagination = commentsData?.pagination;

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Comments</h2>
        {pagination && (
          <Badge variant="secondary" className="text-xs">
            {pagination.total}
          </Badge>
        )}
      </div>

      {/* Create Comment Form */}
      <Card>
        <CardContent className="pt-4">
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
                className="w-full resize-none rounded-lg border bg-background px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50"
                disabled={isSubmitting}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Press{" "}
                  <kbd className="rounded border bg-muted px-1 py-0.5 text-[10px] font-medium">
                    Ctrl+Enter
                  </kbd>{" "}
                  to submit
                </p>
                <Button
                  size="sm"
                  onClick={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmitting}
                  className="gap-1.5"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Send className="h-3.5 w-3.5" />
                  )}
                  Comment
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Loading skeleton khi đang fetch lần đầu */}
      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-1/3 rounded bg-muted animate-pulse" />
                    <div className="h-3 w-full rounded bg-muted animate-pulse" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Comments List */}
      {!isLoading && comments.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">
              <Inbox className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium text-foreground">
              No comments yet
            </p>
            <p className="mt-1 text-center text-sm text-muted-foreground">
              Be the first to share your thoughts.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && comments.length > 0 && (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              currentUserId={currentUserId}
            />
          ))}
        </div>
      )}
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

  // lấy từ cache thay vì useState
  // TanStack Query tự quản lý, không cần local like state riêng
  const liked = comment.likedByMe;
  const likeCount = comment.likeCount;

  // Xử lý toggle like
  const handleToggleLike = useCallback(() => {
    toggleLike.mutate(comment.id);
  }, [toggleLike, comment.id]);

  // Xử lý lưu edit comment
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

  // Xử lý xóa comment
  const handleDelete = useCallback(() => {
    deleteComment.mutate({ postId, commentId: comment.id });
  }, [deleteComment, postId, comment.id]);

  return (
    <Card className="transition-colors hover:bg-muted/30">
      <CardContent className="py-4">
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
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {comment.user?.profile?.displayName ??
                  `User #${comment.user.id}`}
              </span>
              <Separator orientation="vertical" className="h-3" />
              <span className="text-xs text-muted-foreground">
                {new Date(comment.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
              {comment.updatedAt !== comment.createdAt && (
                <>
                  <Separator orientation="vertical" className="h-3" />
                  <span className="text-xs text-muted-foreground italic">
                    edited
                  </span>
                </>
              )}
            </div>

            {/* Nội dung comment - hiển thị textarea khi đang edit */}
            {isEditing ? (
              <div className="mt-2 space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                  disabled={updateComment.isPending}
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="xs"
                    onClick={handleSaveEdit}
                    disabled={!editContent.trim() || updateComment.isPending}
                  >
                    {updateComment.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
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
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/90 whitespace-pre-wrap">
                {comment.content}
              </p>
            )}

            {/* Action buttons: Like, Edit, Delete, Report */}
            <div className="mt-2 flex items-center gap-1">
              <Button
                variant="ghost"
                size="xs"
                className={`gap-1 ${liked ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-foreground"}`}
                onClick={handleToggleLike}
                disabled={toggleLike.isPending}
              >
                <Heart
                  className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`}
                />
                {likeCount > 0 ? likeCount : ""} {liked ? "Liked" : "Like"}
              </Button>

              {isAuthor && !isEditing && (
                <>
                  <Button
                    variant="ghost"
                    size="xs"
                    className="gap-1 text-muted-foreground hover:text-foreground"
                    onClick={() => setIsEditing(true)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="xs"
                        className="gap-1 text-muted-foreground hover:text-red-500"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
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
              )}

              {!isAuthor && currentUserId && !isEditing && (
                <ReportDialog postId={postId} commentId={comment.id} />
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
