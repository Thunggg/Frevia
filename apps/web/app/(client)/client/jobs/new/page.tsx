import accountProfileServerRequest from "@/apiRequests/account-profile.server";
import { VerificationStatus } from "@shared/types";
import { PostJobPageContent } from "./_components/post-job-page-content";

export default async function ClientPostJobPage() {
  const identityStatus = await accountProfileServerRequest
    .getIdentityStatus()
    .catch(() => null);
  const isIdentityVerified = identityStatus
    ? identityStatus.status === VerificationStatus.APPROVED
    : true;

  return <PostJobPageContent isIdentityVerified={isIdentityVerified} />;
}
