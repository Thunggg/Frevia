import { notFound } from "next/navigation";

import jobServerRequest from "@/apiRequests/job.server";
import { JobDetailContent } from "./job-detail-content";

type JobDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { slug } = await params;

  if (!slug.trim()) {
    notFound();
  }

  const job = await jobServerRequest.getJobDetail(slug);

  if (!job) {
    notFound();
  }

  const bookmarkStatus = await jobServerRequest.getBookmarkStatus(slug);

  return (
    <JobDetailContent
      job={job}
      initialIsBookmarked={bookmarkStatus?.isBookmarked ?? false}
    />
  );
}
