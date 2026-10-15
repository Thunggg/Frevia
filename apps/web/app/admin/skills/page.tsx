import { Suspense } from "react";
import adminServerRequest from "@/apiRequests/admin.server";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { Tags } from "lucide-react";
import { CreateSkillDialog } from "./components/create-skill-dialog";
import { SkillsFilterBar } from "./components/skills-filter-bar";
import { SkillsTable } from "./components/skills-table";

export const dynamic = "force-dynamic";

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

  const data = await adminServerRequest.getSkills({
    page,
    limit,
    search,
    deleted,
    sortBy,
    sortOrder,
  });

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
            Skill Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            View, search, and filter the skills catalog (
            <span className="font-semibold text-foreground">
              {pagination.total}
            </span>{" "}
            total skills)
          </p>
        </div>
        <CreateSkillDialog />
      </div>

      <Suspense fallback={<Skeleton className="h-10 w-full" />}>
        <SkillsFilterBar />
      </Suspense>

      <SkillsTable skills={skills} pagination={pagination} />
    </div>
  );
}
