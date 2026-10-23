import { getTranslations } from "next-intl/server";
import authServerRequest from "@/apiRequests/auth.server";
import { RoleName } from "@shared/types";
import { redirect } from "next/navigation";

export async function generateMetadata() {
  const t = await getTranslations("pageMeta");

  return {
    title: t("dashboardTitle"),
    description: t("dashboardDescription"),
  };
}

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

  if (primaryRole === RoleName.EXPERT) {
    redirect("/expert/consultations");
  }

  redirect("/");
}
