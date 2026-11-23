import { getTranslations } from "next-intl/server";
import { ResolutionCenterView } from "@/app/(client)/_components/disputes/resolution-center-view";

export async function generateMetadata() {
  const t = await getTranslations("resolutionCenter.meta");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function ClientDisputesPage() {
  const t = await getTranslations("resolutionCenter.page");

  return (
    <div className="min-h-full bg-[#F8F8FA] dark:bg-background font-sans">
      <section className="border-b border-border bg-background">
        <div className="px-6 pt-8 pb-6 lg:px-8 max-w-7xl mx-auto">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {t("title")}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {t("clientSubtitle")}
          </p>
        </div>
      </section>

      <div className="px-6 py-8 lg:px-8 max-w-7xl mx-auto">
        <ResolutionCenterView />
      </div>
    </div>
  );
}
