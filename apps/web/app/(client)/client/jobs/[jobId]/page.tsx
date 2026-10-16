import { notFound } from "next/navigation";

import jobServerRequest from "@/apiRequests/job.server";

import { JobDetail } from "./_components/job-detail";

export default async function ClientJobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const job = await jobServerRequest.getClientJobDetail(jobId);
  if (!job) notFound();

  return <JobDetail job={job} />;
}
