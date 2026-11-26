import authServerRequest from "@/apiRequests/auth.server";
import jobCategoryServerRequest from "@/apiRequests/job-category.server";
import { canAccessAdminPortal } from "@/lib/admin-access";
import { RoleName } from "@shared/types";
import { redirect } from "next/navigation";
import { HomeView } from "./components/home-view";

export default async function HomePage() {
  const user = await authServerRequest.getMe();

  if (user && !user.isBanned) {
    const primaryRole =
      user.roles.find((role) => role.isPrimary)?.name ?? user.roles[0]?.name;

    if (primaryRole === RoleName.CLIENT) {
      redirect("/client");
    }

    if (primaryRole === RoleName.FREELANCER) {
      redirect("/freelancer");
    }

    if (canAccessAdminPortal(user)) {
      redirect("/admin");
    }

    redirect("/access-denied");
  }

  const categoryResponse = await jobCategoryServerRequest.getJobCategories({
    limit: 50,
  });
  const categories = categoryResponse?.jobCategories ?? [];

  return <HomeView categories={categories} />;
}
