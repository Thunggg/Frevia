import { notFound } from "next/navigation";

import { ClientProposalDetailContent } from "./proposal-detail-content";

export default async function ClientProposalDetailPage({
  params,
}: {
  params: Promise<{ jobId: string; proposalId: string }>;
}) {
  const { jobId, proposalId } = await params;
  const parsedJobId = Number(jobId);
  const parsedProposalId = Number(proposalId);
  if (
    !Number.isInteger(parsedJobId) ||
    !Number.isInteger(parsedProposalId) ||
    parsedJobId <= 0 ||
    parsedProposalId <= 0
  ) {
    notFound();
  }

  return (
    <ClientProposalDetailContent
      jobId={parsedJobId}
      proposalId={parsedProposalId}
    />
  );
}
