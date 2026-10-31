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
  Check,
  Eye,
  ShieldAlert,
  ShieldCheck,
  X,
  Calendar,
  User,
} from "lucide-react";
import { adminApiRequest } from "@/apiRequests/admin";
import { NumberedPagination } from "../../components/numbered-pagination";
import type { PendingForumPostType } from "@shared/types";

interface ModerationTableProps {
  posts: PendingForumPostType[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function ModerationTable({ posts, pagination }: ModerationTableProps) {
  const locale = useLocale();
  const t = useTranslations("adminModeration");
  const tCommon = useTranslations("adminCommon");
  const router = useRouter();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [viewingPost, setViewingPost] = useState<PendingForumPostType | null>(
    null,
  );

  const scoreBadge = (score: number | null) => {
    if (score === null) {
      return <Badge variant="outline">{tCommon("notAvailable")}</Badge>;
    }
    if (score >= 0.8) {
      return <Badge className="bg-destructive text-white">{score.toFixed(2)}</Badge>;
    }
    if (score >= 0.3) {
      return <Badge className="bg-amber-500 text-white">{score.toFixed(2)}</Badge>;
    }
    return <Badge className="bg-emerald-500 text-white">{score.toFixed(2)}</Badge>;
  };

  const handleApprove = async (postId: number) => {
    setPendingId(postId);
    try {
      await adminApiRequest.approvePost(postId);
      toastSuccess({ message: t("approvedToast") });
      setViewingPost(null);
      router.refresh();
    } catch {
      toastError({ message: t("approveFailed") });
    } finally {
      setPendingId(null);
    }
  };

  const handleReject = async (postId: number) => {
    setPendingId(postId);
    try {
      await adminApiRequest.rejectPost(postId);
      toastSuccess({ message: t("rejectedToast") });
      setViewingPost(null);
      router.refresh();
    } catch {
      toastError({ message: t("rejectFailed") });
    } finally {
      setPendingId(null);
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
              <TableHead>{t("colScore")}</TableHead>
              <TableHead>{t("colCategories")}</TableHead>
              <TableHead>{t("colAuthor")}</TableHead>
              <TableHead>{tCommon("created")}</TableHead>
              <TableHead className="w-40 text-right">{tCommon("actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
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
                  <TableCell>{scoreBadge(post.moderationScore)}</TableCell>
                  <TableCell>
                    {post.moderationCategories?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {post.moderationCategories.map((c) => (
                          <Badge key={c} variant="secondary">
                            {c}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">{tCommon("empty")}</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-muted-foreground text-sm">
                        {post.user.profile?.displayName ?? `User #${post.user.id}`}
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
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-emerald-600 hover:text-emerald-600"
                        disabled={pendingId === post.id}
                        onClick={() => handleApprove(post.id)}
                        aria-label={t("approvePostLabel", { title: post.title })}
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            aria-label={t("rejectPostLabel", { title: post.title })}
                          >
                            <ShieldAlert className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>{t("rejectTitle")}</AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("rejectConfirm", { title: post.title })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{tCommon("cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleReject(post.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              {t("rejectAction")}
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
                  <User className="h-3.5 w-3.5" />
                  <span>
                    {viewingPost.user.profile?.displayName ??
                      `User #${viewingPost.user.id}`}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>{formatDate(viewingPost.createdAt, locale)}</span>
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
              <div className="flex items-center justify-end gap-2">
                <Button
                  size="sm"
                  className="bg-emerald-600 text-white hover:bg-emerald-600/90"
                  disabled={pendingId === viewingPost.id}
                  onClick={() => handleApprove(viewingPost.id)}
                >
                  <Check className="h-4 w-4 mr-1.5" />
                  {t("approveAction")}
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={pendingId === viewingPost.id}
                  onClick={() => handleReject(viewingPost.id)}
                >
                  <X className="h-4 w-4 mr-1.5" />
                  {t("rejectAction")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
