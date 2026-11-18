import { getTranslations } from "next-intl/server";
import { ExpertDisputes } from "./expert-disputes";

export async function generateMetadata() {
  const t = await getTranslations("expertDisputes");
  return {
    title: t("title"),
    description: t("subtitle"),
  };
}

export default function AdminDisputesPage() {
  return <ExpertDisputes />;
}
