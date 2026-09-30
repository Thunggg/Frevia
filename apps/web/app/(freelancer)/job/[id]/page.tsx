import { notFound } from "next/navigation";

import { getJobDetailServer } from "@/lib/get-job";
import { JobDetailContent } from "./job-detail-content";

type JobDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;
  const jobId = Number(id);

  if (!Number.isSafeInteger(jobId) || jobId <= 0) {
    notFound();
  }

  const job = await getJobDetailServer(jobId);

  if (!job) {
    notFound();
  }

  return <JobDetailContent job={job} />;
}
