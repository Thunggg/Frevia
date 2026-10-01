"use client";

import {
  useForumPost,
  useForumComments,
  useForumPostLikes,
} from "@/hooks/use-forum";
import { PostDetailView } from "./post-detail-view";
import { Card, CardContent } from "@repo/ui/components/shadcn/card";

type PostDetailWrapperProps = {
  postId: number;
  currentUserId: number | null;
};

export function PostDetailWrapper({
  postId,
  currentUserId,
}: PostDetailWrapperProps) {
  const { data: post, isLoading: isLoadingPost } = useForumPost(postId);
  const { isLoading: isLoadingComments } = useForumComments(postId, 1, 50);
  const { isLoading: isLoadingLikes } = useForumPostLikes(postId);

  // Hiển thị skeleton khi đang load lần đầu
  if (isLoadingPost || isLoadingComments || isLoadingLikes) {
    return (
      <div className="min-h-screen bg-background">
        <div className="relative overflow-hidden border-b bg-gradient-to-br from-primary/5 via-primary/[0.02] to-transparent">
          <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
            <div className="h-4 w-48 rounded bg-muted animate-pulse mb-5" />
            <div className="h-4 w-32 rounded bg-muted animate-pulse mb-4" />
            <div className="h-6 w-64 rounded bg-muted animate-pulse" />
          </div>
        </div>
        <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
          <Card>
            <CardContent className="py-5">
              <div className="space-y-4">
                <div className="h-8 w-3/4 rounded bg-muted animate-pulse" />
                <div className="h-4 w-1/3 rounded bg-muted animate-pulse" />
                <div className="h-20 w-full rounded bg-muted animate-pulse" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Post không tồn tại hoặc đã bị xóa
  if (!post) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-muted-foreground">Post not found</p>
      </div>
    );
  }

  return <PostDetailView post={post} currentUserId={currentUserId} />;
}
