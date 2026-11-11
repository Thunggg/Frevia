import authServerRequest from "@/apiRequests/auth.server";
import { RoleName } from "@shared/types";
import { redirect } from "next/navigation";

export default async function AccountProfileRedirectPage() {
  const user = await authServerRequest.getMe();
  if (!user) {
    redirect("/login?redirect=/account-profile");
  }

  const primaryRole =
    user.roles?.find((role) => role.isPrimary)?.name ?? user.roles?.[0]?.name;

  if (primaryRole === RoleName.CLIENT) {
    redirect("/client/profile");
  }

  if (primaryRole === RoleName.ADMIN) {
    redirect("/admin/profile");
  }

  redirect("/freelancer/profile");
}

