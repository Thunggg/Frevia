import { Suspense } from "react";
import { getAdminPostsServer } from "@/lib/get-admin-data";
import { PostsTable } from "./components/posts-table";
import { SearchBar } from "../components/search-bar";
import { CategoryFilter } from "../components/category-filter";

async function getCategories() {
  const { cookies } = await import("next/headers");
  const { envConfig } = await import("@/configs/validate-env");
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("accessToken")?.value;
  if (!accessToken || !envConfig?.NESTJS_API_URL) return [];
  const res = await fetch(`${envConfig.NESTJS_API_URL}/api/forums/categories`, {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  const data = await res.json();
  return data.success ? data.data : [];
}

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
    getAdminPostsServer(page, limit, search, categoryId),
    getCategories(),
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
