import { Suspense } from "react";
import adminServerRequest from "@/apiRequests/admin.server";
import { DisputesTable } from "./components/disputes-table";

export const metadata = {
  title: "Disputes & Arbitration | Admin Dashboard | Frevia",
  description: "Review and arbitrate milestone dispute cases.",
};

export default async function AdminDisputesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = 10;
  const status = params.status || undefined;

  const data = await adminServerRequest.getDisputes(page, limit, status);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Dispute & Arbitration Cases
        </h1>
        <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
          Review evidence, hear claims, and issue binding milestone settlements ({data.pagination.total} total)
        </p>
      </div>

      <Suspense>
        <DisputesTable
          disputes={data.data}
          pagination={data.pagination}
          currentStatus={status}
        />
      </Suspense>
    </div>
  );
}
