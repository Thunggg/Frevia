import { notFound } from "next/navigation";
import {
  getForumPostDetailServer,
  getForumCommentsServer,
  getForumPostLikesServer,
} from "@/lib/get-forum-posts";
import { getMeServer } from "@/lib/get-me";
import { PostDetailView } from "./components/post-detail-view";

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

  const [post, commentsData, likes, user] = await Promise.all([
    getForumPostDetailServer(postIdNum),
    getForumCommentsServer(postIdNum, 1, 5),
    getForumPostLikesServer(postIdNum),
    getMeServer(),
  ]);

  if (!post) {
    notFound();
  }

  const currentUserId = user?.id ?? null;

  return (
    <PostDetailView
      post={post}
      initialComments={commentsData.comments}
      initialPagination={commentsData.pagination}
      likes={likes}
      currentUserId={currentUserId}
    />
  );
};

export default PostDetailPage;
