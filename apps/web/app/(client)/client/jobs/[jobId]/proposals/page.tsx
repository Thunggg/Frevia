import { notFound } from "next/navigation";

import jobServerRequest from "@/apiRequests/job.server";

import { ProposalList } from "./_components/proposal-list";

export default async function ClientJobProposalsPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const parsedJobId = Number(jobId);
  if (!Number.isInteger(parsedJobId) || parsedJobId <= 0) notFound();
  const job = await jobServerRequest.getClientJobDetail(jobId);
  if (!job) notFound();

  return <ProposalList jobId={parsedJobId} jobTitle={job.title} />;
}
