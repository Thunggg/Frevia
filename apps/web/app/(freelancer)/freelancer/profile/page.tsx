import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import authServerRequest from "@/apiRequests/auth.server";
import { RoleName } from "@shared/types";
import { AccountProfileClient } from "@/app/account-profile/account-profile-client";

export async function generateMetadata() {
  const t = await getTranslations("pageMeta");

  return {
    title: t("profileTitle"),
    description: t("profileDescription"),
  };
}

export default async function FreelancerProfilePage() {
  const user = await authServerRequest.getMe();
  const role = user?.roles.find((item) => item.isPrimary)?.name;

  if (!user || role !== RoleName.FREELANCER) {
    redirect("/account-profile");
  }

  return (
    <AccountProfileClient
      userId={user.id}
      profileId={user.profile?.id ?? null}
      headerRole="FREELANCER"
      embedded={true}
    />
  );
}
