import { getTranslations } from "next-intl/server";
import { ExpertProfileForm } from "./profile-form";

export async function generateMetadata() {
  const t = await getTranslations("pageMeta");

  return { title: t("expertProfileTitle") };
}

export default function ExpertProfilePage() {
  return <ExpertProfileForm />;
}
