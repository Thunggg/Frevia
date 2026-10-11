import { notFound } from "next/navigation";

import authServerRequest from "@/apiRequests/auth.server";
import jobServerRequest from "@/apiRequests/job.server";
import type { UserRole } from "@/components/header";
import { RoleName } from "@shared/types";

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
  const bookmarkStatus =
    role === "FREELANCER"
      ? await jobServerRequest.getBookmarkStatus(slug)
      : null;

  return (
    <JobDetailContent
      job={job}
      role={role}
      initialIsBookmarked={bookmarkStatus?.isBookmarked ?? false}
    />
  );
}
