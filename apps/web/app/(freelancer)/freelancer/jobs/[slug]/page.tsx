import { notFound, redirect } from "next/navigation";

import authServerRequest from "@/apiRequests/auth.server";
import jobServerRequest from "@/apiRequests/job.server";
import proposalServerRequest from "@/apiRequests/proposal.server";
import { type JobType, type ProposalType } from "@shared/types";

import { JobDetailContent } from "@/app/(freelancer)/job/[slug]/job-detail-content";

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

  if (!user) {
    redirect(`/login?callbackUrl=/freelancer/jobs/${slug}`);
  }

  if (!job) {
    notFound();
  }

  const relatedSearch = job.skills[0]?.skill.name;

  const [bookmarkStatus, relatedResult, existingProposal] = await Promise.all([
    jobServerRequest.getBookmarkStatus(slug),
    relatedSearch
      ? jobServerRequest.getJobs({
          page: 1,
          limit: 5,
          skill: relatedSearch,
          sortBy: "createdAt",
          order: "desc",
        })
      : Promise.resolve(null),
    proposalServerRequest.getMyProposalForJob(job.id),
  ]);

  const relatedJobs: JobType[] = (relatedResult?.data ?? [])
    .filter((item) => item.slug !== job.slug)
    .slice(0, 3);

  return (
    <JobDetailContent
      job={job}
      role="FREELANCER"
      initialIsBookmarked={bookmarkStatus?.isBookmarked ?? false}
      relatedJobs={relatedJobs}
      relatedSkill={relatedSearch}
      existingProposal={existingProposal as ProposalType | null}
      embedded={true}
      basePath="/freelancer/find-work"
    />
  );
}
