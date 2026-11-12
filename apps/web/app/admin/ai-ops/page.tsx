import { getTranslations } from "next-intl/server";
import { AiOpsContent } from "./components/ai-ops-content";

export async function generateMetadata() {
  const t = await getTranslations("adminAiOps");

  return {
    title: t("metaTitle"),
  };
}

export default function AdminAiOpsPage() {
  return <AiOpsContent />;
}
