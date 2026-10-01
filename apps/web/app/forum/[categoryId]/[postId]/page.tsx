import { notFound } from "next/navigation";
import { getMeServer } from "@/lib/get-me";
import { PostDetailWrapper } from "./components/post-detail-wrapper";

type PostDetailPageProps = {
  params: Promise<{ categoryId: string; postId: string }>;
};

const PostDetailPage = async ({ params }: PostDetailPageProps) => {
  const { categoryId, postId } = await params;

  const postIdNum = Number(postId);
  const categoryIdNum = Number(categoryId);

  if (
    isNaN(postIdNum) ||
    postIdNum <= 0 ||
    isNaN(categoryIdNum) ||
    categoryIdNum <= 0
  ) {
    notFound();
  }

  const user = await getMeServer();
  const currentUserId = user?.id ?? null;

  return (
    <PostDetailWrapper
      postId={postIdNum}
      currentUserId={currentUserId}
    />
  );
};

export default PostDetailPage;
