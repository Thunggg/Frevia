import authServerRequest from "@/apiRequests/auth.server";
import { canAccessAdminPortal } from "@/lib/admin-access";
import { RoleName } from "@shared/types";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await authServerRequest.getMe();

  if (!user || user.isBanned) {
    redirect("/login");
  }

  const primaryRole =
    user.roles.find((role) => role.isPrimary)?.name ?? user.roles[0]?.name;

  if (primaryRole === RoleName.CLIENT) {
    redirect("/client/jobs");
  }

  if (primaryRole === RoleName.FREELANCER) {
    redirect("/freelancer");
  }

  if (canAccessAdminPortal(user)) {
    redirect("/admin");
  }

  redirect("/access-denied?requiredRole=admin");
}
