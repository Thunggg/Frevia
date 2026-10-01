import { Suspense } from "react";
import { getAdminCommentsServer } from "@/lib/get-admin-data";
import { CommentsTable } from "./components/comments-table";
import { SearchBar } from "../components/search-bar";

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = 10;
  const search = params.search || undefined;

  const data = await getAdminCommentsServer(page, limit, search);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Comments Management
        </h1>
        <p className="text-muted-foreground mt-1">
          Manage all forum comments ({data.pagination.total} total)
        </p>
      </div>
      <Suspense>
        <SearchBar placeholder="Search comments by content..." initialSearch={search} />
      </Suspense>
      <CommentsTable comments={data.comments} pagination={data.pagination} />
    </div>
  );
}
