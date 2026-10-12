import authServerRequest from "@/apiRequests/auth.server";
import { RoleName } from "@shared/types";
import { NotificationsClient } from "./notifications-client";

export default async function NotificationsPage() {
  const user = await authServerRequest.getMe();
  const activeRole = user?.roles.find((role) => role.isPrimary)?.name;
  const headerRole = activeRole === RoleName.CLIENT ? "CLIENT" : "FREELANCER";

  return <NotificationsClient headerRole={headerRole} />;
}
