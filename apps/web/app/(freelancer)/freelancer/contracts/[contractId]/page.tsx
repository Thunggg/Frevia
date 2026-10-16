import { notFound } from "next/navigation";
import contractServerRequest from "@/apiRequests/contract.server";
import { ContractDetail } from "@/app/(client)/client/contracts/[contractId]/_components/contract-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ contractId: string }>;
}) {
  const { contractId } = await params;
  return {
    title: `Contract #${contractId} | Freelancer Dashboard | Frevia`,
    description: "Manage contract details, milestones, and deliverables.",
  };
}

export default async function FreelancerContractDetailPage({
  params,
}: {
  params: Promise<{ contractId: string }>;
}) {
  const { contractId } = await params;
  const parsedId = Number(contractId);
  if (!Number.isInteger(parsedId) || parsedId <= 0) notFound();

  const [contract, milestones, sharedFiles] = await Promise.all([
    contractServerRequest.getContractDetail(parsedId),
    contractServerRequest.getMilestones(parsedId, { limit: 50 }),
    contractServerRequest.getSharedFiles(parsedId),
  ]);

  if (!contract) notFound();

  return (
    <div className="min-h-full bg-background font-sans">
      <div className="px-6 py-8 lg:px-8 max-w-7xl mx-auto">
        <ContractDetail
          initialContract={contract}
          initialMilestones={milestones}
          initialSharedFiles={sharedFiles}
          basePath="/freelancer"
        />
      </div>
    </div>
  );
}
