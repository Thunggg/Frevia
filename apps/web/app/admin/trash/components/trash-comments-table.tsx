"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { formatDate } from "@/lib/format";
import {
  Badge,
} from "@repo/ui/components/shadcn/badge";
import { Button } from "@repo/ui/components/shadcn/button";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/shadcn/table";
import { toastSuccess, toastError } from "@repo/ui/components/shadcn/toast";
import {
  Calendar,
  Eye,
  MessageSquare,
  RotateCcw,
  Trash2,
  User,
} from "lucide-react";
import { adminApiRequest } from "@/apiRequests/admin";
import { NumberedPagination } from "../../components/numbered-pagination";
import type { ForumTrashCommentType } from "@shared/types";

interface TrashCommentsTableProps {
  comments: ForumTrashCommentType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function TrashCommentsTable({
  comments,
  pagination,
}: TrashCommentsTableProps) {
  const locale = useLocale();
  const t = useTranslations("adminTrash");
  const tCommon = useTranslations("adminCommon");
  const router = useRouter();
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [viewingComment, setViewingComment] =
    useState<ForumTrashCommentType | null>(null);

  const handleRestore = async (commentId: number) => {
    setRestoringId(commentId);
    try {
      await adminApiRequest.restoreComment(commentId);
      toastSuccess({ message: t("commentRestoredToast") });
      setViewingComment(null);
      router.refresh();
    } catch {
      toastError({ message: t("restoreCommentFailed") });
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              <TableHead className="w-16">{tCommon("id")}</TableHead>
              <TableHead>{t("colComment")}</TableHead>
              <TableHead>{t("colPost")}</TableHead>
              <TableHead>{t("colAuthor")}</TableHead>
              <TableHead>{t("colDeletedOn")}</TableHead>
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
                  <TableCell className="max-w-sm text-sm text-muted-foreground truncate">
                    {comment.content}
                  </TableCell>
                  <TableCell className="max-w-xs truncate text-sm font-medium">
                    {comment.post.title || `Post #${comment.postId}`}
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
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                    {comment.deletedAt
                      ? formatDate(comment.deletedAt, locale)
                      : tCommon("empty")}
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
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-600"
                            disabled={restoringId === comment.id}
                            aria-label={t("restoreCommentLabel", {
                              title: comment.post.title,
                            })}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t("restoreCommentTitle")}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("restoreCommentConfirm", {
                                title: comment.post.title,
                              })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {tCommon("cancel")}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRestore(comment.id)}
                              className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                            >
                              {restoringId === comment.id
                                ? t("restoringAction")
                                : t("restoreAction")}
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

      <Dialog
        open={!!viewingComment}
        onOpenChange={(open) => !open && setViewingComment(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl pr-8">
              <Trash2 className="h-4 w-4 text-destructive" />
              {t("deletedCommentTitle")}
            </DialogTitle>
          </DialogHeader>
          {viewingComment && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>{viewingComment.post.title}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  <span>
                    {viewingComment.user.profile?.displayName ??
                      `User #${viewingComment.user.id}`}
                  </span>
                </div>
              </div>
              <Separator />
              <p className="text-sm leading-relaxed">{viewingComment.content}</p>
              <Separator />
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("commentIdLabel", { id: viewingComment.id })}</span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {viewingComment.deletedAt
                    ? t("deletedOn", {
                        date: formatDate(viewingComment.deletedAt, locale),
                      })
                    : tCommon("empty")}
                </span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
