import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import adminServerRequest from "@/apiRequests/admin.server";
import authServerRequest from "@/apiRequests/auth.server";
import { hasActionPermission } from "@/lib/admin-access";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { Tags } from "lucide-react";
import { CreateSkillDialog } from "./components/create-skill-dialog";
import { SkillsFilterBar } from "./components/skills-filter-bar";
import { SkillsTable } from "./components/skills-table";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const t = await getTranslations("adminSkills");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function AdminSkillsPage({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    search?: string;
    deleted?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const limit = 10;
  const search = params.search || undefined;
  const deleted = params.deleted || undefined;
  const sortBy =
    params.sortBy === "id" || params.sortBy === "createdAt"
      ? params.sortBy
      : undefined;
  const sortOrder =
    params.sortOrder === "asc" || params.sortOrder === "desc"
      ? params.sortOrder
      : undefined;

  const t = await getTranslations("adminSkills");
  const currentUser = await authServerRequest.getMe();
  const canViewList = hasActionPermission(
    currentUser,
    "GET",
    "/api/admin/skills",
  );

  if (!canViewList) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Tags className="h-8 w-8 text-[#4fae2e]" />
            {t("pageTitle")}
          </h1>
        </div>
        <div className="rounded-lg border bg-card p-12 text-center text-muted-foreground">
          {t("accessDenied")}
        </div>
      </div>
    );
  }

  const data = await adminServerRequest.getSkills({
    page,
    limit,
    search,
    deleted,
    sortBy,
    sortOrder,
  });

  const canCreate = hasActionPermission(
    currentUser,
    "POST",
    "/api/admin/skills",
  );

  const skills = data?.skills ?? [];
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
            <Tags className="h-8 w-8 text-[#4fae2e]" />
            {t("pageTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("pageSubtitle", { total: pagination.total })}
          </p>
        </div>
        {canCreate && <CreateSkillDialog />}
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <SkillsFilterBar />
      </Suspense>

      <SkillsTable skills={skills} pagination={pagination} />
    </div>
  );
}
