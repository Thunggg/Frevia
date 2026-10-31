"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { adminApiRequest } from "@/apiRequests/admin";
import { formatDate } from "@/lib/format";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/shadcn/table";
import { Button } from "@repo/ui/components/shadcn/button";
import { Badge } from "@repo/ui/components/shadcn/badge";
import { Separator } from "@repo/ui/components/shadcn/separator";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@repo/ui/components/shadcn/dialog";
import { toastSuccess, toastError } from "@repo/ui/components/shadcn/toast";
import {
  Trash2,
  Eye,
  Calendar,
  User,
  MessageSquare,
} from "lucide-react";
import { NumberedPagination } from "../../components/numbered-pagination";
import type { ForumAdminCommentType } from "@shared/types";

interface CommentsTableProps {
  comments: ForumAdminCommentType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function CommentsTable({ comments, pagination }: CommentsTableProps) {
  const locale = useLocale();
  const t = useTranslations("adminComments");
  const tCommon = useTranslations("adminCommon");
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [viewingComment, setViewingComment] =
    useState<ForumAdminCommentType | null>(null);

  const handleDelete = async (postId: number, commentId: number) => {
    setDeletingId(commentId);
    try {
      await adminApiRequest.deleteComment(postId, commentId);
      toastSuccess({ message: t("deletedToast") });
      setViewingComment(null);
      router.refresh();
    } catch {
      toastError({ message: t("deleteFailed") });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16">{tCommon("id")}</TableHead>
              <TableHead>{t("colContent")}</TableHead>
              <TableHead>{t("colAuthor")}</TableHead>
              <TableHead>{t("colPost")}</TableHead>
              <TableHead>{tCommon("created")}</TableHead>
              <TableHead className="w-24 text-right">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {comments.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground"
                >
                  {t("empty")}
                </TableCell>
              </TableRow>
            ) : (
              comments.map((comment) => (
                <TableRow key={comment.id} className="group">
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {comment.id}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-muted-foreground">
                    {comment.content.length > 60
                      ? comment.content.slice(0, 60) + "..."
                      : comment.content}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={comment.user.profile?.avatarUrl ?? undefined} />
                        <AvatarFallback className="text-[10px]">
                          <User className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-muted-foreground text-sm">
                        {comment.user.profile?.displayName ??
                          `User #${comment.user.id}`}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate text-sm">
                    {comment.post.title}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                    {formatDate(comment.createdAt, locale)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setViewingComment(comment)}
                        aria-label={t("viewCommentLabel")}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            aria-label={t("deleteCommentLabel")}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("deleteConfirm")}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleDelete(comment.postId, comment.id)
                              }
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deletingId === comment.id
                                ? t("deletingAction")
                                : tCommon("delete")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {pagination.totalPages > 1 && (
        <NumberedPagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
        />
      )}

      {/* View Detail Dialog */}
      <Dialog
        open={!!viewingComment}
        onOpenChange={(open) => !open && setViewingComment(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 pr-8">
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
              {t("detailTitle")}
            </DialogTitle>
          </DialogHeader>
          {viewingComment && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={viewingComment.user.profile?.avatarUrl ?? undefined} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">
                    {viewingComment.user.profile?.displayName ??
                      `User #${viewingComment.user.id}`}
                  </p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(viewingComment.createdAt, locale)}
                  </div>
                </div>
              </div>
              <Separator />
              <div className="rounded-lg bg-muted/50 p-4">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {viewingComment.content}
                </p>
              </div>
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {t("commentOnLabel", { title: viewingComment.post.title })}
                </Badge>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {t("idsLabel", {
                    commentId: viewingComment.id,
                    postId: viewingComment.postId,
                  })}
                </p>

              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
