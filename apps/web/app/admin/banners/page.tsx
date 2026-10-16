import { Suspense } from "react";
import adminServerRequest from "@/apiRequests/admin.server";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { Megaphone } from "lucide-react";
import { CreateBannerDialog } from "./components/create-banner-dialog";
import { BannersFilterBar } from "./components/banners-filter-bar";
import { BannersTable } from "./components/banners-table";

export const dynamic = "force-dynamic";

export default async function AdminBannersPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    deleted?: string;
    position?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = 10;
  const search = params.search || undefined;
  const deleted = params.deleted || undefined;
  const position = params.position || undefined;
  const sortBy =
    params.sortBy === "id" || params.sortBy === "createdAt"
      ? params.sortBy
      : undefined;
  const sortOrder =
    params.sortOrder === "asc" || params.sortOrder === "desc"
      ? params.sortOrder
      : undefined;

  const data = await adminServerRequest.getBanners({
    page,
    limit,
    search,
    deleted,
    position,
    sortBy,
    sortOrder,
  });

  const banners = data?.banners ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Megaphone className="h-8 w-8 text-[#4fae2e]" />
            Banner Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage advertisement banners by display position (
            <span className="font-semibold text-foreground">
              {pagination.total}
            </span>{" "}
            total banners)
          </p>
        </div>
        <CreateBannerDialog />
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <BannersFilterBar />
      </Suspense>

      <BannersTable banners={banners} pagination={pagination} />
    </div>
  );
}