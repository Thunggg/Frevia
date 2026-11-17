import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import authServerRequest from "@/apiRequests/auth.server";
import contractServerRequest from "@/apiRequests/contract.server";
import { envConfig } from "@/configs/validate-env";
import { ContractDetail } from "./_components/contract-detail";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const t = await getTranslations("pageMeta");

  return {
    title: t("contractDetailTitle", { contractId: slug }),
    description: t("contractDetailDescription"),
  };
}

export default async function ClientContractDetailPage({
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
  const cookieStore = await cookies();
  const token = cookieStore.get("accessToken")?.value ?? null;
  const user = await authServerRequest.getMe();

  return (
    <div className="min-h-full bg-background font-sans">
      <div className="px-6 py-8 lg:px-8 max-w-7xl mx-auto">
        <ContractDetail
          initialContract={contract}
          initialSharedFiles={sharedFiles}
          currentUserId={user?.id ?? null}
          accessToken={token}
          socketUrl={envConfig?.NESTJS_API_URL ?? ""}
        />
      </div>
    </div>
  );
}
