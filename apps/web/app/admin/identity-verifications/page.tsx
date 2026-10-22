import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import adminServerRequest from "@/apiRequests/admin.server";
import { IdentityVerificationsTable } from "./components/identity-verifications-table";
import { SearchBar } from "../components/search-bar";

export async function generateMetadata() {
  const t = await getTranslations("adminIdentityVerifications");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function AdminIdentityVerificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; search?: string; status?: string }>;
}) {
  const params = await searchParams;
  const t = await getTranslations("adminIdentityVerifications");
  const page = Number(params.page) || 1;
  const limit = 10;
  const search = params.search || undefined;
  const status = params.status || undefined;

  const data = await adminServerRequest.getIdentityVerifications(
    page,
    limit,
    status,
    search,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("pageTitle")}
        </h1>
        <p className="text-muted-foreground mt-1">
          {t("pageSubtitle", { total: data.pagination.total })}
        </p>
      </div>
      <Suspense>
        <SearchBar
          placeholder={t("searchPlaceholder")}
          initialSearch={search}
        />
      </Suspense>
      <IdentityVerificationsTable
        documents={data.documents}
        pagination={data.pagination}
        currentStatus={status}
      />
    </div>
  );
}
