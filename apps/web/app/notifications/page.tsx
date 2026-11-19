import authServerRequest from "@/apiRequests/auth.server";
import { RoleName } from "@shared/types";
import { redirect } from "next/navigation";

export default async function NotificationsPage() {
  const user = await authServerRequest.getMe();
  if (!user || user.isBanned) {
    redirect("/login?redirect=/notifications");
  }

  const activeRole =
    user?.roles.find((role) => role.isPrimary)?.name ?? user?.roles[0]?.name;

  if (activeRole === RoleName.CLIENT) {
    redirect("/client/notifications");
  }

  if (activeRole === RoleName.FREELANCER) {
    redirect("/freelancer/notifications");
  }

  redirect("/access-denied");
}
