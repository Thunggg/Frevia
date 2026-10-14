import { Suspense } from "react";
import adminServerRequest from "@/apiRequests/admin.server";
import { UsersFilterBar } from "./components/users-filter-bar";
import { UsersTable } from "./components/users-table";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { Users } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    role?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = 10;
  const search = params.search || undefined;
  const role = params.role || undefined;
  const sortBy = params.sortBy || undefined;
  const sortOrder = params.sortOrder || undefined;

  const data = await adminServerRequest.getUsers({
    page,
    limit,
    search,
    role,
    sortBy,
    sortOrder,
  });

  const users = data?.users ?? [];
  const pagination = data?.pagination ?? {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Users className="h-8 w-8 text-[#4fae2e]" />
            User Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View, search, filter, and manage all users in the system (
            <span className="font-semibold text-foreground">
              {pagination.total}
            </span>{" "}
            total users)
          </p>
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <UsersFilterBar />
      </Suspense>

      <UsersTable users={users} pagination={pagination} />
    </div>
  );
}
