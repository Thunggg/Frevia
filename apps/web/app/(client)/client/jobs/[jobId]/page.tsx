import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowLeft } from "lucide-react";

import authServerRequest from "@/apiRequests/auth.server";
import jobServerRequest from "@/apiRequests/job.server";
import { hasActionPermission } from "@/lib/admin-access";
import { Button } from "@repo/ui/components/shadcn/button";

import { JobDetail } from "./_components/job-detail";

export default async function ClientJobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const user = await authServerRequest.getMe();
  const canViewDetail = hasActionPermission(user, "GET", "/api/manage-jobs/:id");

  if (!canViewDetail) {
    const t = await getTranslations("jobDetailClient");
    return (
      <div className="flex min-h-dvh flex-col bg-background font-sans">
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground shadow-xs">
              <p className="text-base font-semibold text-foreground mb-4">
                {t("accessDenied")}
              </p>
              <Button asChild variant="outline">
                <Link href="/client/jobs">
                  <ArrowLeft className="mr-2 size-4" />
                  {t("backToJobs")}
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const job = await jobServerRequest.getClientJobDetail(jobId);
  if (!job) notFound();

  return <JobDetail job={job} />;
}
