import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { RoleName } from "@shared/types";
import authServerRequest from "@/apiRequests/auth.server";
import { NotificationsClient } from "@/app/notifications/notifications-client";

export async function generateMetadata() {
  const t = await getTranslations("notifications");

  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function ExpertNotificationsPage() {
  const user = await authServerRequest.getMe();
  const activeRole = user?.roles.find((role) => role.isPrimary)?.name;

  if (activeRole !== RoleName.EXPERT) {
    redirect("/notifications");
  }

  return <NotificationsClient embedded basePath="/expert" />;
}
