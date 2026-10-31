import { getTranslations } from "next-intl/server";
import authServerRequest from "@/apiRequests/auth.server";
import { RoleName } from "@shared/types";
import { redirect } from "next/navigation";
import { NotificationsClient } from "@/app/notifications/notifications-client";

export async function generateMetadata() {
  const t = await getTranslations("notifications");

  return {
    title: t("metaTitleFreelancer"),
    description: t("metaDescription"),
  };
}

export default async function FreelancerNotificationsPage() {
  const user = await authServerRequest.getMe();
  const activeRole = user?.roles.find((role) => role.isPrimary)?.name;

  if (activeRole !== RoleName.FREELANCER) {
    redirect("/notifications");
  }

  return <NotificationsClient embedded basePath="/freelancer" />;
}
