import forumServerRequest from "@/apiRequests/forum.server";

import { ForumCategoryView } from "./components/forum-category-view";

const DEFAULT_LIMIT = 5;

type ForumPageProps = {
  searchParams: Promise<{ page?: string; search?: string; limit?: string }>;
};

export default async function ForumPage({ searchParams }: ForumPageProps) {
  const { page: pageParam, search: searchParam, limit: limitParam } =
    await searchParams;

  const [categories, topUsers] = await Promise.all([
    forumServerRequest.getCategories(),
    forumServerRequest.getTopUsers(5),
  ]);

  const search = searchParam?.trim() ?? "";
  const limit =
    Number(limitParam) > 0 && Number.isInteger(Number(limitParam))
      ? Number(limitParam)
      : DEFAULT_LIMIT;

  const keyword = search.toLowerCase();
  const filteredCategories = search
    ? categories.filter(
        (category) =>
          category.name.toLowerCase().includes(keyword) ||
          (category.description ?? "").toLowerCase().includes(keyword),
      )
    : categories;

  const total = filteredCategories.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const parsedPage = Number(pageParam);
  const page = Math.min(
    Math.max(1, Number.isInteger(parsedPage) ? parsedPage : 1),
    totalPages,
  );
  const start = (page - 1) * limit;
  const pagedCategories = filteredCategories.slice(start, start + limit);

  const mostActiveCategories = [...categories]
    .sort((a, b) => b.postCount - a.postCount)
    .slice(0, 3);

  return (
    <ForumCategoryView
      categories={pagedCategories}
      mostActiveCategories={mostActiveCategories}
      topUsers={topUsers}
      search={search}
      page={page}
      limit={limit}
      total={total}
    />
  );
}
