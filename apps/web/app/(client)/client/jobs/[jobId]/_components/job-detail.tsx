import authServerRequest from "@/apiRequests/auth.server";
import { RecommendedFreelancersSection } from "@/app/(client)/_components/recommended-freelancers-section";
import { JobDetailContent } from "@/app/(freelancer)/freelancer/jobs/[slug]/job-detail-content";
import type { ViewJobDetailResType } from "@shared/types";

export async function JobDetail({ job }: { job: ViewJobDetailResType }) {
  const user = await authServerRequest.getMe();

  return (
    <div className="pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <JobDetailContent
        job={job}
        role="CLIENT"
        initialIsBookmarked={false}
        existingProposal={null}
        embedded={true}
        basePath="/client/jobs"
        currentUserId={user?.id}
      />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mt-6">
        <RecommendedFreelancersSection
          jobId={job.id}
          jobTitle={job.title}
          jobStatus={job.status}
        />
      </div>
    </div>
  );
}
