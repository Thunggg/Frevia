import { notFound } from "next/navigation";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";
import contractServerRequest from "@/apiRequests/contract.server";
import authServerRequest from "@/apiRequests/auth.server";
import { MilestoneDetailContent } from "./_components";
import { getBrowserSocketUrl } from "@/configs/validate-env";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; milestoneId: string }>;
}) {
  const { slug, milestoneId } = await params;
  const t = await getTranslations("milestoneWorkspace.meta");

  return {
    title: t("detailTitle", { milestoneId, slug }),
    description: t("detailClientDescription"),
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

  const milestone = await contractServerRequest.getMilestoneDetail(
    contract.id,
    parsedMilestoneId,
  );
  if (!milestone) notFound();

  const [submissions, files] = await Promise.all([
    contractServerRequest.getSubmissions(contract.id, parsedMilestoneId),
    contractServerRequest.getMilestoneFiles(contract.id, parsedMilestoneId),
  ]);

  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value ?? null;
  const user = await authServerRequest.getMe();

  return (
    <div className="min-h-full bg-background font-sans">
      <div className="px-6 py-8 lg:px-8 max-w-7xl mx-auto">
        <MilestoneDetailContent
          initialContract={contract}
          initialMilestone={milestone}
          initialSubmissions={submissions || []}
          initialFiles={files || []}
          basePath="/client"
          currentUserId={user?.id ?? null}
          accessToken={token}
          socketUrl={getBrowserSocketUrl()}
        />
      </div>
    </div>
  );
}

