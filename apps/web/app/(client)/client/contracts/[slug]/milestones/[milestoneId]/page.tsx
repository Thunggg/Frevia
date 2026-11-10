import { notFound } from "next/navigation";
import contractServerRequest from "@/apiRequests/contract.server";
import { MilestoneDetailContent } from "./_components";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; milestoneId: string }>;
}) {
  const { slug, milestoneId } = await params;

  return {
    title: `Milestone MLS-${milestoneId} - #${slug}`,
    description: "Detailed view of milestone deliverables, escrow status, submissions, and audit activity.",
  };
}

export default async function ClientMilestoneDetailPage({
  params,
}: {
  params: Promise<{ slug: string; milestoneId: string }>;
}) {
  const { slug, milestoneId } = await params;
  if (!slug || !milestoneId) notFound();

  const parsedMilestoneId = Number(milestoneId);
  if (!Number.isInteger(parsedMilestoneId) || parsedMilestoneId <= 0) {
    notFound();
  }

  const decodedSlug = decodeURIComponent(slug).trim();
  let contract = await contractServerRequest.getContractBySlug(decodedSlug);
  if (!contract) {
    const clean = decodedSlug.replace(/^#/, "").trim();
    const stripped = clean.replace(/^(CON|CTR|contract)-/i, "");
    const parsedContractId = Number(stripped) || Number(clean);
    if (Number.isInteger(parsedContractId) && parsedContractId > 0) {
      contract = await contractServerRequest.getContractDetail(parsedContractId);
    }
  }

  if (!contract) notFound();

  const [milestone, submissions, files] = await Promise.all([
    contractServerRequest.getMilestoneDetail(contract.id, parsedMilestoneId),
    contractServerRequest.getSubmissions(contract.id, parsedMilestoneId),
    contractServerRequest.getMilestoneFiles(contract.id, parsedMilestoneId),
  ]);

  if (!milestone) notFound();

  return (
    <div className="min-h-full bg-background font-sans">
      <div className="px-6 py-8 lg:px-8 max-w-7xl mx-auto">
        <MilestoneDetailContent
          initialContract={contract}
          initialMilestone={milestone}
          initialSubmissions={submissions || []}
          initialFiles={files || []}
          basePath="/client"
        />
      </div>
    </div>
  );
}

