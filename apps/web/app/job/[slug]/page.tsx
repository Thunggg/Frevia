import type { Metadata } from "next";
import { notFound } from "next/navigation";
import authServerRequest from "@/apiRequests/auth.server";
import jobServerRequest from "@/apiRequests/job.server";
import proposalServerRequest from "@/apiRequests/proposal.server";
import { hasActionPermission } from "@/lib/admin-access";
import { type JobType } from "@shared/types";
import { JobDetailContent } from "@/app/(freelancer)/freelancer/jobs/[slug]/job-detail-content";

type PublicJobDetailPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: PublicJobDetailPageProps): Promise<Metadata> {
  const { slug } = await params;
  if (!slug?.trim()) return {};
  const job = await jobServerRequest.getJobDetail(slug);
  if (!job) return {};

  return {
    title: `${job.title} | Frevia`,
    description: job.description
      ? job.description.replace(/<[^>]+>/g, "").slice(0, 160)
      : undefined,
  };
}

export default async function PublicJobDetailPage({
  params,
}: PublicJobDetailPageProps) {
  const { slug } = await params;

  if (!slug?.trim()) {
    notFound();
  }

  const [user, job] = await Promise.all([
    authServerRequest.getMe().catch(() => null),
    jobServerRequest.getJobDetail(slug),
  ]);

  if (!job) {
    notFound();
  }

  const role = user
    ? user.roles?.some((r) => r.name === "FREELANCER")
      ? "FREELANCER"
      : "CLIENT"
    : "GUEST";
  const relatedSearch = job.skills[0]?.skill.name;
  const canCheckBookmark = hasActionPermission(
    user,
    "GET",
    "/api/manage-jobs/jobs/:slug/bookmark",
  );
  const canViewMyProposal =
    hasActionPermission(user, "GET", "/api/proposals/jobs/:jobId/mine") ||
    hasActionPermission(user, "GET", "/api/proposals/my");

  const [bookmarkStatus, relatedResult, existingProposal] = await Promise.all([
    role === "FREELANCER" && canCheckBookmark
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
    role === "FREELANCER" && canViewMyProposal
      ? proposalServerRequest.getMyProposalForJob(job.id)
      : Promise.resolve(null),
  ]);

  const relatedJobs: JobType[] = (relatedResult?.data ?? [])
    .filter((item) => item.slug !== job.slug)
    .slice(0, 3);

  return (
    <div className="mx-auto max-w-7xl">
      <JobDetailContent
        job={job}
        role={role}
        initialIsBookmarked={bookmarkStatus?.isBookmarked ?? false}
        relatedJobs={relatedJobs}
        relatedSkill={relatedSearch}
        existingProposal={existingProposal}
        embedded={false}
        basePath="/job"
        currentUserId={user?.id}
      />
    </div>
  );
}
