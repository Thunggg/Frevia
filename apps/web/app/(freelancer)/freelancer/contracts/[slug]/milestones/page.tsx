import { notFound } from "next/navigation";
import contractServerRequest from "@/apiRequests/contract.server";
import { MilestonesPageContent } from "@/app/(client)/client/contracts/[slug]/milestones/_components";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  return {
    title: `Milestones Management - #${slug}`,
    description: "Track deliverables, submit milestone work, and monitor escrow earnings.",
  };
}

export default async function FreelancerContractMilestonesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slug) notFound();

  const decodedSlug = decodeURIComponent(slug).trim();
  let contract = await contractServerRequest.getContractBySlug(decodedSlug);
  if (!contract) {
    const clean = decodedSlug.replace(/^#/, "").trim();
    const stripped = clean.replace(/^(CON|CTR|contract)-/i, "");
    const parsedId = Number(stripped) || Number(clean);
    if (Number.isInteger(parsedId) && parsedId > 0) {
      contract = await contractServerRequest.getContractDetail(parsedId);
    }
  }

  if (!contract) notFound();

  const sharedFiles = await contractServerRequest.getSharedFiles(contract.id);

  return (
    <div className="min-h-full bg-background font-sans">
      <div className="px-6 py-8 lg:px-8 max-w-7xl mx-auto">
        <MilestonesPageContent
          initialContract={contract}
          initialSharedFiles={sharedFiles}
          basePath="/freelancer"
        />
      </div>
    </div>
  );
}

