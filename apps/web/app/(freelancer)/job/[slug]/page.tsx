import { notFound } from "next/navigation";

import authServerRequest from "@/apiRequests/auth.server";
import jobServerRequest from "@/apiRequests/job.server";
import type { UserRole } from "@/components/header";
import { RoleName, type JobType } from "@shared/types";

import { JobDetailContent } from "./job-detail-content";

type JobDetailPageProps = {
  params: Promise<{ slug: string }>;
};

function resolveHeaderRole(
  user: Awaited<ReturnType<typeof authServerRequest.getMe>>,
): UserRole {
  if (!user) return "GUEST";

  const primaryRole =
    user.roles.find((role) => role.isPrimary) ?? user.roles[0];

  if (primaryRole?.name === RoleName.CLIENT) return "CLIENT";
  if (primaryRole?.name === RoleName.FREELANCER) return "FREELANCER";

  return "FREELANCER";
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
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

  const role = resolveHeaderRole(user);
  const relatedSearch = job.skills[0]?.skill.name;

  const [bookmarkStatus, relatedResult] = await Promise.all([
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
    />
  );
}
