import authServerRequest from "@/apiRequests/auth.server";
import { RoleName } from "@shared/types";
import { redirect } from "next/navigation";
import { NotificationsClient } from "@/app/notifications/notifications-client";

export const metadata = {
  title: "Notifications | Freelancer Dashboard | Frevia",
  description: "View all your notifications and activity updates.",
};

export default async function FreelancerNotificationsPage() {
  const user = await authServerRequest.getMe();
  const activeRole = user?.roles.find((role) => role.isPrimary)?.name;

  if (activeRole !== RoleName.FREELANCER) {
    redirect("/notifications");
  }

  return <NotificationsClient embedded basePath="/freelancer" />;
}
