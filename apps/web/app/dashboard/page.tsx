import authServerRequest from "@/apiRequests/auth.server";
import { RoleName } from "@shared/types";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Redirecting to Dashboard | Frevia",
  description: "Redirecting you to your role dashboard.",
};

export default async function DashboardRedirectPage() {
  const user = await authServerRequest.getMe();

  if (!user) {
    redirect("/login");
  }

  const primaryRole =
    user.roles.find((role) => role.isPrimary)?.name ?? user.roles[0]?.name;

  if (primaryRole === RoleName.ADMIN) {
    redirect("/admin");
  }

  if (primaryRole === RoleName.CLIENT) {
    redirect("/client/jobs");
  }

  if (primaryRole === RoleName.FREELANCER) {
    redirect("/freelancer/find-work");
  }

  redirect("/");
}
