import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import authServerRequest from "@/apiRequests/auth.server";
import { canAccessAdminPortal } from "@/lib/admin-access";
import { RoleName } from "@shared/types";
import { AccountProfileClient } from "./account-profile-client";

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

  if (!user) {
    redirect("/login?redirect=/freelancer/profile");
  }

  if (role === RoleName.EXPERT) {
    redirect("/expert/profile");
  }

  if (
    role === RoleName.ADMIN ||
    (role !== RoleName.CLIENT &&
      role !== RoleName.FREELANCER &&
      canAccessAdminPortal(user))
  ) {
    redirect("/admin/profile");
  }

  if (role !== RoleName.FREELANCER) {
    redirect("/client/profile");
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
  