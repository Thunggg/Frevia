import { notFound } from "next/navigation";

import { getBookmarkStatusServer, getJobDetailServer } from "@/lib/get-job";
import { JobDetailContent } from "./job-detail-content";

type JobDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { slug } = await params;

  if (!slug.trim()) {
    notFound();
  }

  const [job, bookmarkStatus] = await Promise.all([
    getJobDetailServer(slug),
    getBookmarkStatusServer(slug),
  ]);

  if (!job) {
    notFound();
  }

  return (
    <JobDetailContent
      job={job}
      initialIsBookmarked={bookmarkStatus?.isBookmarked ?? false}
    />
  );
}
