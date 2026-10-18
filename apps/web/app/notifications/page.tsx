import authServerRequest from "@/apiRequests/auth.server";
import { RoleName } from "@shared/types";
import { redirect } from "next/navigation";
import { NotificationsClient } from "./notifications-client";

export default async function NotificationsPage() {
  const user = await authServerRequest.getMe();
  const activeRole = user?.roles.find((role) => role.isPrimary)?.name;

  if (activeRole === RoleName.CLIENT) {
    redirect("/client/notifications");
  }

  if (activeRole === RoleName.FREELANCER) {
    redirect("/freelancer/notifications");
  }

  return <NotificationsClient headerRole="FREELANCER" />;
}
