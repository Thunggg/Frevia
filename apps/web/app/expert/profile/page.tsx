import { getTranslations } from "next-intl/server";
import { ExpertProfileForm } from "./profile-form";
import { Suspense } from "react";

export async function generateMetadata() {
  const t = await getTranslations("pageMeta");

  return { title: t("expertProfileTitle") };
}

export default function ExpertProfilePage() {
  return (
    <Suspense>
      <ExpertProfileForm />
    </Suspense>
  );
}
