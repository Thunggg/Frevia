import { getTranslations } from "next-intl/server";
import proposalServerRequest from "@/apiRequests/proposal.server";
import type { ProposalStatusType } from "@shared/types";
import { MyProposalsContent } from "../../proposals/proposals-content";

type ProposalsPageProps = {
  searchParams: Promise<{ page?: string; status?: string }>;
};

export async function generateMetadata() {
  const t = await getTranslations("pageMeta");

  return {
    title: t("proposalsTitle"),
    description: t("proposalsDescription"),
  };
}

export default async function FreelancerProposalsPage({
  searchParams,
}: ProposalsPageProps) {
  const params = await searchParams;
  const candidatePage = Number(params.page);
  const page =
    Number.isInteger(candidatePage) && candidatePage > 0 ? candidatePage : 1;
  const status = params.status as ProposalStatusType | undefined;
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
