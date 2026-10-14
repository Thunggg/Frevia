import { notFound } from "next/navigation";
import proposalServerRequest from "@/apiRequests/proposal.server";
import { ProposalDetailContent } from "./proposal-detail-content";

export default async function ProposalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const proposalId = Number(id);
  if (!Number.isInteger(proposalId) || proposalId <= 0) notFound();
  const proposal = await proposalServerRequest.getProposalDetail(proposalId);
  if (!proposal) notFound();
  return <ProposalDetailContent proposal={proposal} />;
}
