import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import adminServerRequest from "@/apiRequests/admin.server";
import { SearchBar } from "../components/search-bar";
import { ProfileRevisionsTable } from "./profile-revisions-table";

export async function generateMetadata() {
  const t = await getTranslations("adminProfileRevisions");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function AdminProfileRevisionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    status?: string;
    profileType?: string;
  }>;
}) {
  const params = await searchParams;
  const t = await getTranslations("adminProfileRevisions");
  const page = Math.max(1, Number(params.page) || 1);
  const selectedStatus = params.status ?? "PENDING";
  const data = await adminServerRequest.getProfileRevisions({
    page,
    limit: 10,
    search: params.search || undefined,
    status: selectedStatus === "ALL" ? undefined : selectedStatus,
    profileType: params.profileType || undefined,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          {t("pageTitle")}
        </h1>
        <p className="mt-1 text-muted-foreground">{t("pageSubtitle")}</p>
      </div>

      <Suspense>
        <SearchBar
          placeholder={t("searchPlaceholder")}
          initialSearch={params.search}
        />
      </Suspense>

      <ProfileRevisionsTable
        revisions={data.revisions}
        pagination={data.pagination}
        currentStatus={selectedStatus}
        currentType={params.profileType}
      />
    </div>
  );
}
