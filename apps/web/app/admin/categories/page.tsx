import { Suspense } from "react";
import adminServerRequest from "@/apiRequests/admin.server";
import { CategoriesTable } from "./components/categories-table";
import { CreateCategoryDialog } from "./components/create-category-dialog";
import { CategoriesFilterBar } from "./components/categories-filter-bar";

export default async function AdminCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    deleted?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = 10;
  const search = params.search || undefined;
  const deleted = params.deleted || undefined;
  const sortBy = params.sortBy || undefined;
  const sortOrder = params.sortOrder || undefined;

  const data = await adminServerRequest.getAdminCategories(
    page,
    limit,
    search,
    sortBy,
    sortOrder,
    deleted,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Categories Management
          </h1>
          <p className="mt-1 text-muted-foreground">
            Manage all forum categories ({data.pagination.total} total)
          </p>
        </div>
        <CreateCategoryDialog />
      </div>

      <Suspense>
        <CategoriesFilterBar initialSearch={search} />
      </Suspense>
      <CategoriesTable
        categories={data.categories}
        pagination={data.pagination}
      />
    </div>
  );
}
