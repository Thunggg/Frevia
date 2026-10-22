import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import proposalServerRequest from "@/apiRequests/proposal.server";
import { ProposalDetailContent } from "../../../proposals/[id]/proposal-detail-content";

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
