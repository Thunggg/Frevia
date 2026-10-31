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
  RotateCcw,
  Trash2,
  User,
} from "lucide-react";
import { adminApiRequest } from "@/apiRequests/admin";
import { NumberedPagination } from "../../components/numbered-pagination";
import type { ForumTrashPostType } from "@shared/types";

interface TrashPostsTableProps {
  posts: ForumTrashPostType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function TrashPostsTable({ posts, pagination }: TrashPostsTableProps) {
  const locale = useLocale();
  const t = useTranslations("adminTrash");
  const tCommon = useTranslations("adminCommon");
  const router = useRouter();
  const [restoringId, setRestoringId] = useState<number | null>(null);
  const [viewingPost, setViewingPost] = useState<ForumTrashPostType | null>(
    null,
  );

  const statusBadge = (status: ForumTrashPostType["moderationStatus"]) => {
    if (status === "REJECTED") {
      return <Badge variant="destructive">{tCommon("rejected")}</Badge>;
    }
    if (status === "PENDING") {
      return <Badge className="bg-amber-500 text-white">{tCommon("pending")}</Badge>;
    }
    return <Badge variant="secondary">{tCommon("approved")}</Badge>;
  };

  const handleRestore = async (postId: number) => {
    setRestoringId(postId);
    try {
      await adminApiRequest.restorePost(postId);
      toastSuccess({ message: t("postRestoredToast") });
      setViewingPost(null);
      router.refresh();
    } catch {
      toastError({ message: t("restorePostFailed") });
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
              <TableHead>{t("colTitle")}</TableHead>
              <TableHead>{tCommon("status")}</TableHead>
              <TableHead>{t("colAuthor")}</TableHead>
              <TableHead>{t("colDeletedOn")}</TableHead>
              <TableHead className="w-24 text-right">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-12 text-muted-foreground"
                >
                  {t("empty")}
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post.id} className="group">
                  <TableCell>
                    <Badge variant="outline" className="font-mono">
                      {post.id}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium max-w-xs truncate">
                    {post.title}
                  </TableCell>
                  <TableCell>{statusBadge(post.moderationStatus)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={post.user.profile?.avatarUrl ?? undefined} />
                        <AvatarFallback className="text-[10px]">
                          <User className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-muted-foreground text-sm">
                        {post.user.profile?.displayName ?? `User #${post.user.id}`}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                    {post.deletedAt
                      ? formatDate(post.deletedAt, locale)
                      : tCommon("empty")}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setViewingPost(post)}
                        aria-label={t("viewPostLabel", { title: post.title })}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-emerald-600 hover:text-emerald-600"
                            disabled={restoringId === post.id}
                            aria-label={t("restorePostLabel", { title: post.title })}
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t("restorePostTitle")}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("restorePostConfirm", { title: post.title })}
                              {post.moderationStatus === "REJECTED"
                                ? ` ${t("restorePostRequeued")}`
                                : ` ${t("restorePostPublic")}`}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>
                              {tCommon("cancel")}
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleRestore(post.id)}
                              className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                            >
                              {restoringId === post.id
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
        open={!!viewingPost}
        onOpenChange={(open) => !open && setViewingPost(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between text-xl pr-8">
              {viewingPost?.title}
              {viewingPost && (
                <span className="flex items-center gap-2 text-sm font-normal">
                  <Trash2 className="h-4 w-4 text-destructive" />
                  {statusBadge(viewingPost.moderationStatus)}
                </span>
              )}
            </DialogTitle>
          </DialogHeader>
          {viewingPost && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={viewingPost.user.profile?.avatarUrl ?? undefined} />
                    <AvatarFallback className="text-[10px]">
                      <User className="h-3 w-3" />
                    </AvatarFallback>
                  </Avatar>
                  <span>
                    {viewingPost.user.profile?.displayName ??
                      `User #${viewingPost.user.id}`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>
                    {t("createdOn", {
                      date: formatDate(viewingPost.createdAt, locale),
                    })}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>
                    {viewingPost.deletedAt
                      ? t("deletedOn", {
                          date: formatDate(viewingPost.deletedAt, locale),
                        })
                      : t("inTrashRejected")}
                  </span>
                </div>
                <div>
                  {t("scoreLabel", {
                    score:
                      viewingPost.moderationScore?.toFixed(2) ??
                      tCommon("notAvailable"),
                  })}
                </div>
              </div>
              <Separator />
              <div
                className="post-content text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: viewingPost.content }}
              />
              <Separator />
              <div className="text-xs text-muted-foreground">
                {t("postIdLabel", { id: viewingPost.id })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
