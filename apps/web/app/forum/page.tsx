import authServerRequest from "@/apiRequests/auth.server";
import forumServerRequest from "@/apiRequests/forum.server";
import type { UserRole } from "@/components/header";
import { RoleName } from "@shared/types";

import { ForumCategoryView } from "./components/forum-category-view";

function resolveHeaderRole(
  user: Awaited<ReturnType<typeof authServerRequest.getMe>>,
): UserRole {
  if (!user) return "GUEST";

  const primaryRole =
    user.roles.find((role) => role.isPrimary) ?? user.roles[0];

  if (primaryRole?.name === RoleName.CLIENT) return "CLIENT";
  if (primaryRole?.name === RoleName.FREELANCER) return "FREELANCER";

  return "FREELANCER";
}

export default async function ForumPage() {
  const [user, categories, topCategories, topUsers] = await Promise.all([
    authServerRequest.getMe(),
    forumServerRequest.getCategories(),
    forumServerRequest.getTopCategories(3),
    forumServerRequest.getTopUsers(5),
  ]);

  return (
    <ForumCategoryView
      role={resolveHeaderRole(user)}
      categories={categories}
      topCategories={topCategories}
      topUsers={topUsers}
    />
  );
}
