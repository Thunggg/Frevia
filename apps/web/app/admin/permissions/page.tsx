import { Suspense } from "react";
import { AdminTableSkeleton } from "../components/table-skeleton";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { PermissionsTable } from "./components/permissions-table";

function PermissionsPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-72" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <Skeleton className="h-9 w-full max-w-sm" />
        <Skeleton className="h-9 w-[140px]" />
        <Skeleton className="h-9 w-[180px]" />
      </div>
      <AdminTableSkeleton
        columns={["w-16", "w-24", "", "w-28", "w-28", "w-20"]}
        rows={10}
      />
    </div>
  );
}

export default function AdminPermissionsPage() {
  return (
    <Suspense fallback={<PermissionsPageSkeleton />}>
      <PermissionsTable />
    </Suspense>
  );
}
