import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import adminServerRequest from "@/apiRequests/admin.server";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { FolderTree } from "lucide-react";
import { CreateJobCategoryDialog } from "./components/create-job-category-dialog";
import { JobCategoriesFilterBar } from "./components/job-categories-filter-bar";
import { JobCategoriesTable } from "./components/job-categories-table";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("adminJobCategories");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function AdminJobCategoriesPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    deleted?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = 10;
  const search = params.search || undefined;
  const status =
    params.status === "ACTIVE" || params.status === "INACTIVE"
      ? params.status
      : undefined;
  const deleted = params.deleted || undefined;
  const sortBy =
    params.sortBy === "id" ||
    params.sortBy === "createdAt" ||
    params.sortBy === "name"
      ? params.sortBy
      : undefined;
  const sortOrder =
    params.sortOrder === "asc" || params.sortOrder === "desc"
      ? params.sortOrder
      : undefined;

  const data = await adminServerRequest.getJobCategories({
    page,
    limit,
    search,
    status,
    deleted,
    sortBy,
    sortOrder,
  });

  const jobCategories = data?.jobCategories ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  };

  const t = await getTranslations("adminJobCategories");

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FolderTree className="h-8 w-8 text-[#4fae2e]" />
            {t("pageTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("pageSubtitle", { total: pagination.total })}
          </p>
        </div>
        <CreateJobCategoryDialog />
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <JobCategoriesFilterBar />
      </Suspense>

      <JobCategoriesTable
        jobCategories={jobCategories}
        pagination={pagination}
      />
    </div>
  );
}
