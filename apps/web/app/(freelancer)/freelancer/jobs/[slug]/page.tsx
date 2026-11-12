import { notFound } from "next/navigation";

import authServerRequest from "@/apiRequests/auth.server";
import jobServerRequest from "@/apiRequests/job.server";
import proposalServerRequest from "@/apiRequests/proposal.server";
import { type JobType, type ProposalType } from "@shared/types";

import { JobDetailContent } from "./job-detail-content";

type FreelancerJobDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export default async function FreelancerJobDetailPage({
  params,
}: FreelancerJobDetailPageProps) {
  const { slug } = await params;

  if (!slug.trim()) {
    notFound();
  }

  const [user, job] = await Promise.all([
    authServerRequest.getMe(),
    jobServerRequest.getJobDetail(slug),
  ]);

  if (!job) {
    notFound();
  }

  const role = user ? "FREELANCER" : "GUEST";
  const relatedSearch = job.skills[0]?.skill.name;

  const [bookmarkStatus, relatedResult, existingProposal] = await Promise.all([
    role === "FREELANCER"
      ? jobServerRequest.getBookmarkStatus(slug)
      : Promise.resolve(null),
    relatedSearch
      ? jobServerRequest.getJobs({
          page: 1,
          limit: 5,
          skill: relatedSearch,
          sortBy: "createdAt",
          order: "desc",
        })
      : Promise.resolve(null),
    role === "FREELANCER"
      ? proposalServerRequest.getMyProposalForJob(job.id)
      : Promise.resolve(null),
  ]);

  const relatedJobs: JobType[] = (relatedResult?.data ?? [])
    .filter((item) => item.slug !== job.slug)
    .slice(0, 3);

  return (
    <JobDetailContent
      job={job}
      role={role}
      initialIsBookmarked={bookmarkStatus?.isBookmarked ?? false}
      relatedJobs={relatedJobs}
      relatedSkill={relatedSearch}
      existingProposal={existingProposal}
      embedded={true}
      basePath="/freelancer"
      currentUserId={user?.id}
    />
  );
}
