import { getTranslations } from "next-intl/server";
import contractServerRequest from "@/apiRequests/contract.server";
import { ContractList } from "@/app/(client)/client/contracts/_components/contract-list";

export async function generateMetadata() {
  const t = await getTranslations("contracts");

  return {
    title: t("metaTitleFreelancer"),
    description: t("metaDescription"),
  };
}

export default async function FreelancerContractsPage() {
  const initialContracts = await contractServerRequest.getContracts({
    limit: 50,
  });
  const t = await getTranslations("contracts");

  return (
    <div className="min-h-full bg-background font-sans">
      <section className="border-b border-border bg-background">
        <div className="px-6 pt-8 pb-6 lg:px-8 max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("pageTitle")}
          </h1>
          <p className="mt-1 text-xs font-normal text-muted-foreground">
            {t("pageSubtitleFreelancer")}
          </p>
        </div>
      </section>

      <div className="px-6 py-8 lg:px-8 max-w-7xl mx-auto">
        <ContractList initialData={initialContracts} basePath="/freelancer" />
      </div>
    </div>
  );
}
