import { redirect } from "next/navigation";
import authServerRequest from "@/apiRequests/auth.server";
import { canAccessAdminPortal } from "@/lib/admin-access";
import { RoleName } from "@shared/types";
import { ClientProfileSettings } from "./client-profile-settings";

export default async function ClientProfilePage() {
  const user = await authServerRequest.getMe();
  const primaryRole = user?.roles.find((role) => role.isPrimary)?.name;

  if (!user) {
    redirect("/login?redirect=/client/profile");
  }

  if (
    primaryRole === RoleName.ADMIN ||
    (primaryRole !== RoleName.CLIENT &&
      primaryRole !== RoleName.FREELANCER &&
      primaryRole !== RoleName.EXPERT &&
      canAccessAdminPortal(user))
  ) {
    redirect("/admin/profile");
  }

  if (primaryRole !== RoleName.CLIENT) {
    redirect("/freelancer/profile");
  }

  return <ClientProfileSettings userId={user.id} />;
}
