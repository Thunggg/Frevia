import authServerRequest from "@/apiRequests/auth.server";
import { JobDetailContent } from "@/app/(freelancer)/freelancer/jobs/[slug]/job-detail-content";
import type { ViewJobDetailResType } from "@shared/types";

export async function JobDetail({ job }: { job: ViewJobDetailResType }) {
  const user = await authServerRequest.getMe();

  return (
    <JobDetailContent
      job={job}
      role="CLIENT"
      initialIsBookmarked={false}
      existingProposal={null}
      embedded={true}
      basePath="/client/jobs"
      currentUserId={user?.id}
    />
  );
}
