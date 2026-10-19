import { notFound } from "next/navigation";
import proposalServerRequest from "@/apiRequests/proposal.server";
import { ProposalDetailContent } from "../../../proposals/[id]/proposal-detail-content";

export const metadata = {
  title: "Proposal Details | Freelancer Dashboard | Frevia",
  description: "View details of your submitted proposal.",
};

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
