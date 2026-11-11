import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { MySessionsContent } from "@/app/sessions/components/my-sessions-content";
import { Skeleton } from "@repo/ui/components/shadcn/skeleton";

export async function generateMetadata() {
  const t = await getTranslations("sessions");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default function AdminSessionsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-4">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-6 w-96" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <MySessionsContent embedded />
    </Suspense>
  );
}
