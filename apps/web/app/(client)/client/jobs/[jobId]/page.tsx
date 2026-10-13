import { notFound } from "next/navigation";

import jobServerRequest from "@/apiRequests/job.server";

import { ProjectDetailContent } from "../../../projects/[id]/project-detail-content";

export default async function ClientJobDetailPage({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const job = await jobServerRequest.getClientJobDetail(jobId);
  if (!job) notFound();

  return <ProjectDetailContent job={job} />;
}
