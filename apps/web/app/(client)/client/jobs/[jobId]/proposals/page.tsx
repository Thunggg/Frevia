import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

import authServerRequest from "@/apiRequests/auth.server";
import jobServerRequest from "@/apiRequests/job.server";
import { ArrowLeft } from "@/components/icons";
import { hasActionPermission } from "@/lib/admin-access";
import { Button } from "@repo/ui/components/shadcn/button";

import { ProposalList } from "./_components/proposal-list";

export default async function ClientJobProposalsPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const parsedJobId = Number(jobId);
  if (!Number.isInteger(parsedJobId) || parsedJobId <= 0) notFound();

  const user = await authServerRequest.getMe();
  const canViewProposals =
    hasActionPermission(user, "GET", "/api/jobs/:jobId/proposals") ||
    hasActionPermission(user, "GET", "/api/proposals/jobs/:jobId/submitted");

  if (!canViewProposals) {
    const t = await getTranslations("clientProposals");
    return (
      <div className="flex min-h-dvh flex-col bg-background font-sans">
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground shadow-xs">
              <p className="text-base font-semibold text-foreground mb-4">
                {t("accessDenied")}
              </p>
              <Button asChild variant="outline">
                <Link href={`/client/jobs/${jobId}`}>
                  <ArrowLeft className="mr-2 size-4" />
                  {t("backToJob")}
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

  return (
    <ProposalList
      jobId={parsedJobId}
      jobTitle={job.title}
      hiringType={job.hiringType}
      positionsRequired={job.positionsRequired}
      positionsFilled={job.positionsFilled}
      jobStatus={job.status}
    />
  );
}
