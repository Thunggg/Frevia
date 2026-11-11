import { redirect } from "next/navigation";
import authServerRequest from "@/apiRequests/auth.server";
import { RoleName } from "@shared/types";
import { ClientProfileSettings } from "./client-profile-settings";

export default async function ClientProfilePage() {
  const user = await authServerRequest.getMe();
  const primaryRole =
    user?.roles.find((role) => role.isPrimary)?.name ?? user?.roles[0]?.name;

  if (!user) {
    redirect("/login?redirect=/client/profile");
  }

  if (primaryRole !== RoleName.CLIENT) {
    redirect("/freelancer/profile");
  }

  return <ClientProfileSettings userId={user.id} />;
}
