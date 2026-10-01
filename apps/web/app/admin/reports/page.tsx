import { Suspense } from "react";
import { getAdminReportsServer } from "@/lib/get-admin-data";
import { ReportsTable } from "./components/reports-table";
import { SearchBar } from "../components/search-bar";

export default async function AdminReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = 10;
  const search = params.search || undefined;
  const status = params.status || undefined;

  const data = await getAdminReportsServer(page, limit, status, search);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reports Management</h1>
        <p className="text-muted-foreground mt-1">
          Review and manage content reports ({data.pagination.total} total)
        </p>
      </div>
      <Suspense>
        <SearchBar placeholder="Search report reasons..." initialSearch={search} />
      </Suspense>
      <ReportsTable
        reports={data.reports}
        pagination={data.pagination}
        currentStatus={status}
      />
    </div>
  );
}
