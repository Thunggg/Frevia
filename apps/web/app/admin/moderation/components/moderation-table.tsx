"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
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
import { AdminPagination } from "../../components/admin-pagination";
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

function scoreBadge(score: number | null) {
  if (score === null) {
    return <Badge variant="outline">N/A</Badge>;
  }
  if (score >= 0.8) {
    return <Badge className="bg-destructive text-white">{score.toFixed(2)}</Badge>;
  }
  if (score >= 0.3) {
    return <Badge className="bg-amber-500 text-white">{score.toFixed(2)}</Badge>;
  }
  return <Badge className="bg-emerald-500 text-white">{score.toFixed(2)}</Badge>;
}

export function ModerationTable({ posts, pagination }: ModerationTableProps) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [viewingPost, setViewingPost] = useState<PendingForumPostType | null>(
    null,
  );

  const handleApprove = async (postId: number) => {
    setPendingId(postId);
    try {
      await adminApiRequest.approvePost(postId);
      toastSuccess({ message: "Post approved and now visible publicly" });
      setViewingPost(null);
      router.refresh();
    } catch {
      toastError({ message: "Couldn't approve post. Try again." });
    } finally {
      setPendingId(null);
    }
  };

  const handleReject = async (postId: number) => {
    setPendingId(postId);
    try {
      await adminApiRequest.rejectPost(postId);
      toastSuccess({ message: "Post rejected and moved to trash" });
      setViewingPost(null);
      router.refresh();
    } catch {
      toastError({ message: "Couldn't reject post. Try again." });
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
              <TableHead className="w-16">ID</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead>Author</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-40 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {posts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center py-12 text-muted-foreground"
                >
                  No posts awaiting moderation.
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
                      <span className="text-muted-foreground text-sm">—</span>
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
                    {new Date(post.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => setViewingPost(post)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-emerald-600 hover:text-emerald-600"
                        disabled={pendingId === post.id}
                        onClick={() => handleApprove(post.id)}
                      >
                        <ShieldCheck className="h-4 w-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                          >
                            <ShieldAlert className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Reject Post</AlertDialogTitle>
                            <AlertDialogDescription>
                              Reject &quot;{post.title}&quot;? The post will not
                              be visible publicly and will be moved to trash.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleReject(post.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Reject
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
        <AdminPagination
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
                  <span>
                    {new Date(viewingPost.createdAt).toLocaleDateString(
                      "en-US",
                      { year: "numeric", month: "long", day: "numeric" },
                    )}
                  </span>
                </div>
                <div>Score: {viewingPost.moderationScore?.toFixed(2) ?? "N/A"}</div>
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
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  disabled={pendingId === viewingPost.id}
                  onClick={() => handleReject(viewingPost.id)}
                >
                  <X className="h-4 w-4 mr-1.5" />
                  Reject
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}