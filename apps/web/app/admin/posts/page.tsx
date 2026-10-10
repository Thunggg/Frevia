import { Suspense } from "react";
import adminServerRequest from "@/apiRequests/admin.server";
import forumServerRequest from "@/apiRequests/forum.server";
import { PostsTable } from "./components/posts-table";
import { SearchBar } from "../components/search-bar";
import { CategoryFilter } from "../components/category-filter";

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; categoryId?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = 10;
  const search = params.search || undefined;
  const categoryId = params.categoryId ? Number(params.categoryId) : undefined;

  const [data, categories] = await Promise.all([
    adminServerRequest.getPosts(page, limit, search, categoryId),
    forumServerRequest.getCategories(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Posts Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage all forum posts ({data.pagination.total} total)
        </p>
      </div>
      <div className="flex items-center gap-3 flex-wrap">
        <Suspense>
          <SearchBar placeholder="Search posts by title..." initialSearch={search} />
        </Suspense>
        <Suspense>
          <CategoryFilter
            categories={categories}
            currentValue={params.categoryId}
          />
        </Suspense>
      </div>
      <PostsTable posts={data.posts} pagination={data.pagination} />
    </div>
  );
}
