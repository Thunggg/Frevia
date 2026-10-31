import { getTranslations } from "next-intl/server";
import contractServerRequest from "@/apiRequests/contract.server";
import { ContractList } from "./_components/contract-list";

export async function generateMetadata() {
  const t = await getTranslations("contracts");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function ClientContractsPage() {
  const initialContracts = await contractServerRequest.getContracts({ limit: 50 });
  const t = await getTranslations("contracts");

  return (
    <div className="min-h-full bg-background font-sans">
      <section className="border-b border-border bg-background">
        <div className="px-6 pt-8 pb-6 lg:px-8">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t("pageTitle")}
          </h1>
        </div>
      </section>

      <div className="px-6 py-8 lg:px-8 max-w-7xl mx-auto">
        <ContractList initialData={initialContracts} />
      </div>
    </div>
  );
}
