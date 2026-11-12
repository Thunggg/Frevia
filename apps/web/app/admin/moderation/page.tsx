import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import adminServerRequest from "@/apiRequests/admin.server";
import authServerRequest from "@/apiRequests/auth.server";
import { hasActionPermission } from "@/lib/admin-access";
import { ModerationTable } from "./components/moderation-table";

export async function generateMetadata() {
  const t = await getTranslations("adminModeration");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function AdminModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const t = await getTranslations("adminModeration");
  const currentUser = await authServerRequest.getMe();
  const canViewPendingPosts = hasActionPermission(
    currentUser,
    "GET",
    "/api/forums/admin/pending-posts",
  );

  if (!canViewPendingPosts) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {t("pageTitle")}
          </h1>
        </div>
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
          {t("accessDenied")}
        </div>
      </div>
    );
  }

  const page = Number(params.page) || 1;
  const limit = 10;

  const data = await adminServerRequest.getPendingPosts(page, limit);

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
        <ModerationTable posts={data.posts} pagination={data.pagination} />
      </Suspense>
    </div>
  );
}
