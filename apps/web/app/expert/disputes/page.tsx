import { getTranslations } from "next-intl/server";
import { ExpertDisputes } from "./expert-disputes";

export async function generateMetadata() {
  const t = await getTranslations("expertShell");
  return { title: `${t("disputes")} | Frevia` };
}

export default function ExpertDisputesPage() {
  return <ExpertDisputes />;
}
