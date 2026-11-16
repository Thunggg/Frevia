import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import authServerRequest from "@/apiRequests/auth.server";
import proposalServerRequest from "@/apiRequests/proposal.server";
import { ArrowLeft } from "@/components/icons";
import { hasActionPermission } from "@/lib/admin-access";
import { Button } from "@repo/ui/components/shadcn/button";
import { ProposalDetailContent } from "./proposal-detail-content";

export async function generateMetadata() {
  const t = await getTranslations("pageMeta");

  return {
    title: t("proposalDetailTitle"),
    description: t("proposalDetailDescription"),
  };
}

export default async function FreelancerProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const proposalId = Number(id);
  if (!Number.isInteger(proposalId) || proposalId <= 0) notFound();

  const user = await authServerRequest.getMe();
  const canViewDetail = hasActionPermission(user, "GET", "/api/proposals/:id");

  if (!canViewDetail) {
    const t = await getTranslations("proposalDetail");
    return (
      <div className="flex min-h-dvh flex-col bg-background font-sans">
        <main className="flex-1">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground shadow-xs">
              <p className="text-base font-semibold text-foreground mb-4">
                {t("accessDenied")}
              </p>
              <Button asChild variant="outline">
                <Link href="/freelancer/proposals">
                  <ArrowLeft className="mr-2 size-4" />
                  {t("backToList")}
                </Link>
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const proposal = await proposalServerRequest.getProposalDetail(proposalId);
  if (!proposal) notFound();

  return (
    <ProposalDetailContent
      proposal={proposal}
      embedded={true}
      basePath="/freelancer/proposals"
    />
  );
}
