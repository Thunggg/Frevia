import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import adminServerRequest from "@/apiRequests/admin.server";
import { DisputesTable } from "./components/disputes-table";

export async function generateMetadata() {
  const t = await getTranslations("adminDisputes");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

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
  const t = await getTranslations("adminDisputes");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("pageTitle")}
        </h1>
        <p className="text-muted-foreground mt-1 text-xs sm:text-sm">
          {t("pageSubtitle", { total: data.pagination.total })}
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
