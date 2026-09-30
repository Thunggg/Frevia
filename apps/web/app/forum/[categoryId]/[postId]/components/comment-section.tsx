"use client";

import { useState, useCallback, useEffect } from "react";
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
import type { ForumCommentType, PaginationMeta } from "@shared/types";
import { forumApiRequest } from "@/apiRequests/forum";
import { ReportDialog } from "./report-dialog";

type CommentSectionProps = {
  postId: number;
  initialComments: ForumCommentType[];
  initialPagination: PaginationMeta;
  currentUserId: number | null;
  onCountChange?: (total: number) => void;
};

export function CommentSection({
  postId,
  initialComments,
  initialPagination,
  currentUserId,
  onCountChange,
}: CommentSectionProps) {
  const [comments, setComments] =
    useState<ForumCommentType[]>(initialComments);
  const [pagination, setPagination] = useState(initialPagination);
  const [currentPage, setCurrentPage] = useState(1);
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const hasMore = currentPage < pagination.totalPages;

  useEffect(() => {
    onCountChange?.(pagination.total);
  }, [pagination.total, onCountChange]);

  const refetchAllPages = useCallback(
    async (page: number) => {
      const allComments: ForumCommentType[] = [];
      let lastPagination = { page: 1, limit: pagination.limit, total: 0, totalPages: 0 };

      for (let p = 1; p <= page; p++) {
        const result = await forumApiRequest.getComments(postId, p, pagination.limit);
        if (!result.success) break;
        allComments.push(...result.data.comments);
        lastPagination = result.data.pagination;
      }

      setComments(allComments);
      setPagination(lastPagination);
    },
    [postId, pagination.limit],
  );

  const handleLoadMore = useCallback(async () => {
    if (isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    try {
      const nextPage = currentPage + 1;
      const result = await forumApiRequest.getComments(
        postId,
        nextPage,
        pagination.limit,
      );
      if (result.success) {
        setComments((prev) => [...prev, ...result.data.comments]);
        setPagination(result.data.pagination);
        setCurrentPage(nextPage);
      }
    } catch {
      // silent fail
    } finally {
      setIsLoadingMore(false);
    }
  }, [postId, currentPage, pagination.limit, isLoadingMore, hasMore]);

  const handleSubmitComment = useCallback(async () => {
    if (!newComment.trim() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const result = await forumApiRequest.createComment(
        postId,
        newComment.trim(),
      );
      if (result.success) {
        setNewComment("");
        await refetchAllPages(currentPage);
      }
    } catch {
      // silent fail
    } finally {
      setIsSubmitting(false);
    }
  }, [postId, newComment, isSubmitting, currentPage, refetchAllPages]);

  return (
    <div className="space-y-6">
      {/* Section Header */}
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Comments</h2>
        <Badge variant="secondary" className="text-xs">
          {pagination.total}
        </Badge>
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

      {/* Comments List */}
      {comments.length === 0 ? (
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
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              postId={postId}
              currentUserId={currentUserId}
              onUpdated={async () => {
                await refetchAllPages(currentPage);
              }}
              onDeleted={async () => {
                await refetchAllPages(currentPage);
              }}
            />
          ))}
        </div>
      )}

      {/* Load More */}
      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isLoadingMore}
            className="gap-2"
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <MessageSquare className="h-4 w-4" />
                Load more comments ({pagination.total - comments.length}{" "}
                remaining)
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

/* ---------- Single Comment Item ---------- */

function CommentItem({
  comment,
  postId,
  currentUserId,
  onUpdated,
  onDeleted,
}: {
  comment: ForumCommentType;
  postId: number;
  currentUserId: number | null;
  onUpdated: () => void;
  onDeleted: () => void;
}) {
  const [liked, setLiked] = useState(comment.likedByMe);
  const [likeCount, setLikeCount] = useState(comment.likeCount);
  const [isLiking, setIsLiking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isSaving, setIsSaving] = useState(false);

  const isAuthor = currentUserId === comment.user.id;

  const handleToggleLike = useCallback(async () => {
    if (isLiking) return;
    setIsLiking(true);

    const previousLiked = liked;
    const previousCount = likeCount;

    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);

    try {
      await forumApiRequest.toggleLikeComment(postId, comment.id);
    } catch {
      setLiked(previousLiked);
      setLikeCount(previousCount);
    } finally {
      setIsLiking(false);
    }
  }, [liked, likeCount, isLiking, postId, comment.id]);

  const handleSaveEdit = useCallback(async () => {
    if (!editContent.trim() || isSaving) return;
    setIsSaving(true);

    try {
      const result = await forumApiRequest.editComment(
        postId,
        comment.id,
        editContent.trim(),
      );
      if (result.success) {
        setIsEditing(false);
        onUpdated();
      }
    } catch {
      // silent fail
    } finally {
      setIsSaving(false);
    }
  }, [postId, comment.id, editContent, isSaving, onUpdated]);

  const handleDelete = useCallback(async () => {
    try {
      const result = await forumApiRequest.deleteComment(postId, comment.id);
      if (result.success) {
        onDeleted();
      }
    } catch {
      // silent fail
    }
  }, [postId, comment.id, onDeleted]);

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
              {comment.user?.profile?.displayName
                ?.charAt(0)
                ?.toUpperCase() ?? "?"}
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

            {isEditing ? (
              <div className="mt-2 space-y-2">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-lg border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
                  disabled={isSaving}
                  autoFocus
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="xs"
                    onClick={handleSaveEdit}
                    disabled={!editContent.trim() || isSaving}
                  >
                    {isSaving ? (
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
                    disabled={isSaving}
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

            <div className="mt-2 flex items-center gap-1">
              <Button
                variant="ghost"
                size="xs"
                className={`gap-1 ${liked ? "text-red-500 hover:text-red-600" : "text-muted-foreground hover:text-foreground"}`}
                onClick={handleToggleLike}
                disabled={isLiking}
              >
                <Heart
                  className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`}
                />
                {likeCount > 0 ? likeCount : ""}{" "}
                {liked ? "Liked" : "Like"}
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
