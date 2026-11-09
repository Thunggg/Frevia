import { notFound } from "next/navigation";
import authServerRequest from "@/apiRequests/auth.server";
import { extractIdFromSlug } from "@/lib/slug-utils";
import { PostDetailWrapper } from "./components/post-detail-wrapper";

type PostDetailPageProps = {
  params: Promise<{ categorySlug: string; postSlug: string }>;
};

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { categorySlug, postSlug } = await params;
  const categoryId = extractIdFromSlug(categorySlug);
  const postId = extractIdFromSlug(postSlug);

  if (!categoryId || !postId) {
    notFound();
  }

  const user = await authServerRequest.getMe();
  const currentUserId = user?.id ?? null;

  return (
    <main className="flex-1">
      <PostDetailWrapper
        postId={postId}
        categoryId={categoryId}
        categorySlug={categorySlug}
        postSlug={postSlug}
        currentUserId={currentUserId}
      />
    </main>
  );
}
