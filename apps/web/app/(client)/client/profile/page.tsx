import { redirect } from "next/navigation";
import authServerRequest from "@/apiRequests/auth.server";
import { RoleName } from "@shared/types";
import { ClientProfileSettings } from "./client-profile-settings";

export default async function ClientProfilePage() {
  const user = await authServerRequest.getMe();
  const primaryRole = user?.roles.find((role) => role.isPrimary)?.name;

  if (!user || primaryRole !== RoleName.CLIENT) {
    redirect("/account-profile");
  }

  return <ClientProfileSettings userId={user.id} />;
}
