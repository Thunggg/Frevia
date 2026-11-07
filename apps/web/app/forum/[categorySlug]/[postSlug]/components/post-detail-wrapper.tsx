"use client";

import { useTranslations } from "next-intl";
import Link from "next/link";

import { useForumPost } from "@/hooks/use-forum";
import { buildSlugId } from "@/lib/slug-utils";

import { PostDetailView } from "./post-detail-view";
import { PostDetailSkeleton } from "./post-detail-skeleton";

type PostDetailWrapperProps = {
  postId: number;
  categoryId: number;
  categorySlug: string;
  postSlug: string;
  currentUserId: number | null;
};

export function PostDetailWrapper({
  postId,
  categoryId,
  categorySlug,
  currentUserId,
}: PostDetailWrapperProps) {
  const t = useTranslations("forum");
  const { data: post, isLoading: isLoadingPost } = useForumPost(postId);

  if (isLoadingPost) {
    return <PostDetailSkeleton />;
  }

  if (!post) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center px-4 py-24 text-center sm:px-6">
        <p className="text-lg font-medium text-foreground">
          {t("postNotFound")}
        </p>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          {t("postNotFoundDescription")}
        </p>
        <Link
          href={`/forum/${buildSlugId(categorySlug, categoryId)}`}
          className="mt-6 text-sm font-medium text-[#4fae2e] transition-colors hover:text-[#459928]"
        >
          {t("backToCategory")}
        </Link>
      </div>
    );
  }

  return (
    <PostDetailView
      post={post}
      categoryId={categoryId}
      categorySlug={categorySlug}
      currentUserId={currentUserId}
    />
  );
}
