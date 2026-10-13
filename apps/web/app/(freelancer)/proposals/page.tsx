import proposalServerRequest from "@/apiRequests/proposal.server";
import { MyProposalsContent } from "./proposals-content";

type ProposalsPageProps = {
  searchParams: Promise<{ page?: string; status?: string }>;
};

export default async function ProposalsPage({
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
  return <MyProposalsContent result={proposals} />;
}
