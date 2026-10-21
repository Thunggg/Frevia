import { getTranslations } from "next-intl/server";
import { UserDisputesList } from "@/app/(freelancer)/freelancer/disputes/_components/user-disputes-list";

export async function generateMetadata() {
  const t = await getTranslations("disputes");

  return {
    title: t("metaTitleClient"),
    description: t("metaDescription"),
  };
}

export default async function ClientDisputesPage() {
  const t = await getTranslations("disputes");

  return (
    <div className="min-h-full bg-background font-sans">
      <section className="border-b border-border bg-background">
        <div className="px-6 pt-8 pb-6 lg:px-8 max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
            {t("pageTitle")}
          </h1>
          <p className="mt-1 text-xs font-normal text-muted-foreground">
            {t("pageSubtitleClient")}
          </p>
        </div>
      </section>

      <div className="px-6 py-8 lg:px-8 max-w-7xl mx-auto">
        <UserDisputesList isFreelancer={false} />
      </div>
    </div>
  );
}
