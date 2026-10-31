import authServerRequest from "@/apiRequests/auth.server";
import { RoleName } from "@shared/types";
import { redirect } from "next/navigation";
import { NotificationsClient } from "@/app/notifications/notifications-client";

export default async function ClientNotificationsPage() {
  const user = await authServerRequest.getMe();
  const activeRole = user?.roles.find((role) => role.isPrimary)?.name;

  if (activeRole !== RoleName.CLIENT) {
    redirect("/notifications");
  }

  return <NotificationsClient embedded basePath="/client" />;
}
