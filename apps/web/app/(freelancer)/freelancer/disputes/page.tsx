import { getTranslations } from "next-intl/server";
import { ResolutionCenterView } from "@/app/(client)/_components/disputes/resolution-center-view";

export async function generateMetadata() {
  const t = await getTranslations("resolutionCenter.meta");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function FreelancerDisputesPage() {
  return (
    <div className="min-h-full bg-background font-sans">
      <div className="px-6 py-8 lg:px-8 max-w-7xl mx-auto">
        <ResolutionCenterView basePath="/freelancer" />
      </div>
    </div>
  );
}
