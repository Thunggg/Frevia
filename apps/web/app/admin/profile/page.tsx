import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { AdminProfileView } from "./components/admin-profile-view";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";

export async function generateMetadata() {
  const t = await getTranslations("adminProfile");
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default function AdminProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-6 w-96" />
          <Skeleton className="h-96 w-full" />
        </div>
      }
    >
      <AdminProfileView />
    </Suspense>
  );
}
