"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
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
  ExternalLink,
  Calendar,
  User,
} from "lucide-react";
import { NumberedPagination } from "../../components/numbered-pagination";
import type { ForumPostWithUserType } from "@shared/types";

interface PostsTableProps {
  posts: ForumPostWithUserType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function PostsTable({ posts, pagination }: PostsTableProps) {
  const locale = useLocale();
  const t = useTranslations("adminPosts");
  const tCommon = useTranslations("adminCommon");
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [viewingPost, setViewingPost] = useState<ForumPostWithUserType | null>(
    null,
  );

  const handleDelete = async (postId: number) => {
    setDeletingId(postId);
    try {
      await adminApiRequest.deletePost(postId);
      toastSuccess({ message: t("deletedToast") });
      setViewingPost(null);
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
              <TableHead>{t("colTitle")}</TableHead>
              <TableHead>{t("colAuthor")}</TableHead>
              <TableHead>{tCommon("created")}</TableHead>
              <TableHead className="w-24 text-right">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
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
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={post.user.profile?.avatarUrl ?? undefined} />
                        <AvatarFallback className="text-[10px]">
                          <User className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-muted-foreground text-sm">
                        {post.user.profile?.displayName ??
                          `User #${post.user.id}`}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                    {formatDate(post.createdAt, locale)}
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
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            aria-label={t("deletePostLabel", { title: post.title })}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("deleteConfirm", { title: post.title })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(post.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {deletingId === post.id
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
        open={!!viewingPost}
        onOpenChange={(open) => !open && setViewingPost(null)}
      >
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl pr-8">
              {viewingPost?.title}
            </DialogTitle>
          </DialogHeader>
          {viewingPost && (
            <div className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                  <span>{formatDate(viewingPost.createdAt, locale)}</span>
                </div>
              </div>
              <Separator />
              <div
                className="post-content text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: viewingPost.content }}
              />
              <Separator />
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  {t("postIdLabel", { id: viewingPost.id })}
                </p>
                <Link
                  href={`/forum/${viewingPost.categoryId ?? "general"}/${viewingPost.id}`}
                  target="_blank"
                >
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    {t("viewOnForum")}
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
