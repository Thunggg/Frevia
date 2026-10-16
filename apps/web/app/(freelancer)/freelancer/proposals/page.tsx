import proposalServerRequest from "@/apiRequests/proposal.server";
import { MyProposalsContent } from "../../proposals/proposals-content";

type ProposalsPageProps = {
  searchParams: Promise<{ page?: string; status?: string }>;
};

export const metadata = {
  title: "My Proposals | Freelancer Dashboard | Frevia",
  description: "View and manage all your submitted and draft proposals.",
};

export default async function FreelancerProposalsPage({
  searchParams,
}: ProposalsPageProps) {
  const params = await searchParams;
  const candidatePage = Number(params.page);
  const page =
    Number.isInteger(candidatePage) && candidatePage > 0 ? candidatePage : 1;
  const status = params.status as
    | "DRAFT"
    | "PENDING"
    | "ACCEPTED"
    | "REJECTED"
    | "WITHDRAWN"
    | undefined;
  const proposals = await proposalServerRequest.getMyProposals({
    page,
    limit: 10,
    status,
  });

  return (
    <MyProposalsContent
      result={proposals}
      embedded={true}
      basePath="/freelancer/proposals"
    />
  );
}
