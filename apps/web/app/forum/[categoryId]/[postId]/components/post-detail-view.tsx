"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Home,
  ArrowLeft,
  Heart,
  MessageSquare,
  Calendar,
  Tag,
  Trash2,
} from "lucide-react";
import type { ViewForumPostDetailResponseType } from "@shared/types";
import {
  useTogglePostLike,
  useDeletePost,
  useForumPostLikes,
  useForumComments,
} from "@/hooks/use-forum";
import { CommentSection } from "./comment-section";
import { EditPostDialog } from "./edit-post-dialog";
import { ReportDialog } from "./report-dialog";

// Props - chỉ nhận post và currentUserId, mọi thứ khác do Query quản lý

type PostDetailViewProps = {
  post: ViewForumPostDetailResponseType;
  currentUserId: number | null;
};

export function PostDetailView({ post, currentUserId }: PostDetailViewProps) {
  const router = useRouter();
  const isAuthor = currentUserId === post.userId;

  // Queries: likes và comments
  const { data: likes } = useForumPostLikes(post.id);
  const { data: commentsData } = useForumComments(post.id, 1, 50);

  // Mutations: like post, xóa pos
  const toggleLike = useTogglePostLike(post.id, currentUserId);
  const deletePost = useDeletePost();

  const liked =
    currentUserId && likes
      ? likes.some((l: { userId: number }) => l.userId === currentUserId)
      : false;
  const likeCount = likes?.length ?? 0;
  const commentTotal = commentsData?.pagination.total ?? 0;

  // Local UI state: hiển thị title/content sau khi edit
  const [displayTitle, setDisplayTitle] = useState(post.title);
  const [displayContent, setDisplayContent] = useState(post.content);

  // Xử lý toggle like post
  const handleToggleLike = useCallback(() => {
    toggleLike.mutate();
  }, [toggleLike]);

  // Xử lý xóa post
  const handleDeletePost = useCallback(() => {
    deletePost.mutate(post.id, {
      onSuccess: () => {
        router.push(`/forum/${post.category?.id ?? ""}`);
      },
    });
  }, [deletePost, post.id, post.category?.id, router]);

  // Xử lý sau khi edit post thành công
  const handlePostUpdated = useCallback((title: string, content: string) => {
    setDisplayTitle(title);
    setDisplayContent(content);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header với breadcrumb */}
      <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent">
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <nav className="mb-5 flex items-center gap-1.5 text-sm text-muted-foreground">
            <Link
              href="/"
              className="inline-flex items-center gap-1 transition-colors hover:text-foreground"
            >
              <Home className="h-3.5 w-3.5" />
              Home
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <Link
              href="/forum"
              className="transition-colors hover:text-foreground"
            >
              Community Forum
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <Link
              href={`/forum/${post.category?.id ?? ""}`}
              className="transition-colors hover:text-foreground"
            >
              {post.category?.name ?? "Unknown"}
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <span className="max-w-[150px] truncate font-medium text-foreground">
              Post #{post.id}
            </span>
          </nav>

          <Link
            href={`/forum/${post.category?.id ?? ""}`}
            className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to {post.category?.name ?? "category"}
          </Link>

          <div className="flex items-center gap-2">
            {post.category && (
              <Badge variant="secondary" className="gap-1.5">
                <Tag className="h-3 w-3" />
                {post.category.name}
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <article>
          {/* Post Title + Action buttons */}
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {displayTitle}
            </h1>
            {isAuthor && (
              <div className="flex items-center gap-1 shrink-0">
                <EditPostDialog
                  postId={post.id}
                  initialTitle={displayTitle}
                  initialContent={displayContent}
                  onUpdated={handlePostUpdated}
                />
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
                      <AlertDialogTitle>Delete Post</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete this post? This action
                        cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeletePost}
                        className="bg-destructive text-white hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            )}
          </div>

          {/* Author + Meta */}
          <div className="mt-4 flex items-center gap-3">
            <Avatar>
              <AvatarImage
                src={post.user?.profile?.avatarUrl ?? undefined}
                alt={post.user?.profile?.displayName ?? "User"}
              />
              <AvatarFallback>
                {post.user?.profile?.displayName?.charAt(0)?.toUpperCase() ??
                  "?"}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-foreground">
                {post.user?.profile?.displayName ?? `User #${post.userId}`}
              </p>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {new Date(post.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
                {post.updatedAt !== post.createdAt && (
                  <>
                    <span>&middot;</span>
                    <span>
                      Edited{" "}
                      {new Date(post.updatedAt).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Post Body */}
          <div
            className="post-content text-base leading-relaxed text-foreground"
            dangerouslySetInnerHTML={{ __html: displayContent }}
          />

          <Separator className="my-6" />

          {/* Actions Bar: Like + Comment count + Report */}
          <div className="flex items-center gap-4">
            <Button
              variant={liked ? "default" : "outline"}
              size="sm"
              className={`gap-2 ${liked ? "bg-red-500 hover:bg-red-600 text-white border-red-500" : ""}`}
              onClick={handleToggleLike}
              disabled={toggleLike.isPending}
            >
              <Heart className={`h-4 w-4 ${liked ? "fill-current" : ""}`} />
              {likeCount} {likeCount === 1 ? "Like" : "Likes"}
            </Button>

            <Badge variant="secondary" className="gap-1.5 px-3 py-1">
              <MessageSquare className="h-3.5 w-3.5" />
              {commentTotal} {commentTotal === 1 ? "comment" : "comments"}
            </Badge>

            {!isAuthor && currentUserId && <ReportDialog postId={post.id} />}
          </div>
        </article>

        {/* Comment Section - tự fetch data bằng useForumComments query */}
        <div className="mt-10">
          <CommentSection postId={post.id} currentUserId={currentUserId} />
        </div>
      </div>
    </div>
  );
}
