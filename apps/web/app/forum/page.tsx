import authServerRequest from "@/apiRequests/auth.server";
import forumServerRequest from "@/apiRequests/forum.server";
import { ForumTalksView } from "./components/forum-talks-view";

const DEFAULT_LIMIT = 20;

type ForumPageProps = {
  searchParams: Promise<{ page?: string; search?: string; limit?: string }>;
};

export default async function ForumPage({ searchParams }: ForumPageProps) {
  const { page: pageParam, search: searchParam, limit: limitParam } =
    await searchParams;

  const search = searchParam?.trim() ?? "";
  const limit =
    Number(limitParam) > 0 && Number.isInteger(Number(limitParam))
      ? Number(limitParam)
      : DEFAULT_LIMIT;
  const parsedPage = Number(pageParam);
  const page = Number.isInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;

  const [categories, postsResponse, topUsers, currentUser] = await Promise.all([
    forumServerRequest.getCategories(),
    forumServerRequest.getPosts({
      page,
      limit,
      search: search || undefined,
    }),
    forumServerRequest.getTopUsers(10),
    authServerRequest.getMe(),
  ]);

  const posts = postsResponse?.posts ?? [];
  const pagination = postsResponse?.pagination ?? null;

  return (
    <ForumTalksView
      posts={posts}
      pagination={pagination}
      categories={categories}
      topUsers={topUsers}
      currentUserId={currentUser?.id ?? null}
    />
  );
}
