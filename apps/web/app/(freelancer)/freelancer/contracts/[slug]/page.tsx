import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import contractServerRequest from "@/apiRequests/contract.server";
import { ContractDetail } from "@/app/(client)/client/contracts/[slug]/_components/contract-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = await getTranslations("pageMeta");

  return {
    title: t("contractDetailFreelancerTitle", { contractId: slug }),
    description: t("contractDetailDescription"),
  };
}

export default async function FreelancerContractDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  if (!slug) notFound();

  // Try fetching by slug first, fallback to numeric ID if applicable
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
        <ContractDetail
          initialContract={contract}
          initialSharedFiles={sharedFiles}
          basePath="/freelancer"
        />
      </div>
    </div>
  );
}
