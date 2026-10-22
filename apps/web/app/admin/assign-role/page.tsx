import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";
import { AssignRoleContent } from "./components/assign-role-content";

export async function generateMetadata() {
  const t = await getTranslations("adminAssignRole");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

function AssignRolePageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      <Skeleton className="h-9 w-[260px]" />
      <div className="rounded-lg border bg-card p-4 space-y-3">
        {Array.from({ length: 8 }, (_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    </div>
  );
}

export default function AdminAssignRolePage() {
  return (
    <Suspense fallback={<AssignRolePageSkeleton />}>
      <AssignRoleContent />
    </Suspense>
  );
}
