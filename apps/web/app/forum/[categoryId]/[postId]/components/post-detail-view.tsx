"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Calendar,
  Heart,
  MessageSquare,
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
import type { ViewForumPostDetailResponseType } from "@shared/types";

import {
  useDeletePost,
  useForumComments,
  useForumPostLikes,
  useTogglePostLike,
} from "@/hooks/use-forum";

import { CommentSection } from "./comment-section";
import { EditPostDialog } from "./edit-post-dialog";
import { PostLikesDialog } from "./post-likes-dialog";
import { ReportDialog } from "./report-dialog";

type PostDetailViewProps = {
  post: ViewForumPostDetailResponseType;
  categoryId: number;
  currentUserId: number | null;
};

function formatDate(value: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

export function PostDetailView({
  post,
  categoryId,
  currentUserId,
}: PostDetailViewProps) {
  const router = useRouter();
  const isAuthor = currentUserId === post.userId;
  const resolvedCategoryId = post.category?.id ?? categoryId;
  const categoryName = post.category?.name ?? "Category";

  const { data: likes } = useForumPostLikes(post.id);
  const { data: commentsData } = useForumComments(post.id, 1, 50);

  const toggleLike = useTogglePostLike(post.id, currentUserId);
  const deletePost = useDeletePost();

  const liked =
    currentUserId && likes
      ? likes.some((l: { userId: number }) => l.userId === currentUserId)
      : false;
  const likeCount = likes?.length ?? 0;
  const commentTotal = commentsData?.pagination.total ?? 0;

  const [displayTitle, setDisplayTitle] = useState(post.title);
  const [displayContent, setDisplayContent] = useState(post.content);

  const handleToggleLike = useCallback(() => {
    if (!currentUserId) {
      router.push("/login");
      return;
    }
    toggleLike.mutate();
  }, [currentUserId, router, toggleLike]);

  const handleDeletePost = useCallback(() => {
    deletePost.mutate(post.id, {
      onSuccess: () => {
        router.push(`/forum/${resolvedCategoryId}`);
      },
    });
  }, [deletePost, post.id, resolvedCategoryId, router]);

  const handlePostUpdated = useCallback((title: string, content: string) => {
    setDisplayTitle(title);
    setDisplayContent(content);
  }, []);

  const wasEdited =
    new Date(post.updatedAt).getTime() !== new Date(post.createdAt).getTime();

  return (
    <div>
      <section className="border-b border-[#4fae2e]/15 bg-[#eaf8df] dark:border-white/10 dark:bg-[#1a1c1a]">
        <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <nav className="text-sm text-foreground/60">
            <Link href="/" className="transition-colors hover:text-[#4fae2e]">
              Home
            </Link>
            <span className="mx-2 text-foreground/35">/</span>
            <Link
              href="/forum"
              className="transition-colors hover:text-[#4fae2e]"
            >
              Forum
            </Link>
            <span className="mx-2 text-foreground/35">/</span>
            <Link
              href={`/forum/${resolvedCategoryId}`}
              className="transition-colors hover:text-[#4fae2e]"
            >
              {categoryName}
            </Link>
            <span className="mx-2 text-foreground/35">/</span>
            <span className="max-w-[180px] truncate font-medium text-foreground sm:max-w-[280px]">
              {displayTitle}
            </span>
          </nav>

          <p className="mt-4 text-sm text-foreground/65">
            Discussion in{" "}
            <Link
              href={`/forum/${resolvedCategoryId}`}
              className="font-medium text-[#4fae2e] transition-colors hover:text-[#3f9225]"
            >
              {categoryName}
            </Link>
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <article>
          <div className="flex items-start justify-between gap-4">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              {displayTitle}
            </h1>
            {isAuthor ? (
              <div className="flex shrink-0 items-center gap-1">
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
            ) : null}
          </div>

          <div className="mt-5 flex items-center gap-3">
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
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Calendar className="size-3 text-[#4fae2e]" />
                  {formatDate(post.createdAt)}
                </span>
                {wasEdited ? (
                  <>
                    <span className="text-foreground/35">·</span>
                    <span>Edited {formatDate(post.updatedAt)}</span>
                  </>
                ) : null}
              </div>
            </div>
          </div>

          <div
            className="post-content mt-8 max-w-prose text-[15px] leading-8 text-foreground/90 [&_a]:text-[#4fae2e] [&_a]:underline-offset-2 hover:[&_a]:underline [&_h1]:mb-3 [&_h1]:text-xl [&_h1]:font-semibold [&_h1]:text-foreground [&_h2]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-foreground [&_h3]:mb-2 [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-4 [&_p:last-child]:mb-0 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-5"
            dangerouslySetInnerHTML={{ __html: displayContent }}
          />

          <div className="mt-8 flex flex-wrap items-center gap-1 border-y border-border py-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleToggleLike}
              disabled={toggleLike.isPending}
              className={
                liked
                  ? "gap-1.5 px-3 text-[#4fae2e] hover:bg-[#eaf8df] hover:text-[#3f9225] dark:hover:bg-white/5"
                  : "gap-1.5 px-3 text-muted-foreground hover:bg-[#eaf8df]/60 hover:text-[#4fae2e] dark:hover:bg-white/5/40"
              }
            >
              <Heart
                className={`size-[18px] transition-transform ${
                  liked ? "scale-110 fill-current" : ""
                }`}
              />
              <span className="text-sm font-medium tabular-nums">
                {likeCount}
              </span>
            </Button>

            <div className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-muted-foreground">
              <MessageSquare className="size-[18px]" />
              <span className="font-medium tabular-nums">{commentTotal}</span>
            </div>

            {!isAuthor && currentUserId ? (
              <ReportDialog postId={post.id} />
            ) : null}
          </div>

          <div className="mt-2">
            <PostLikesDialog postId={post.id} count={likeCount} />
          </div>
        </article>

        <div className="mt-10">
          <CommentSection postId={post.id} currentUserId={currentUserId} />
        </div>
      </div>
    </div>
  );
}
